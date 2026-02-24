import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateSku, useUpdateSku } from "@/hooks/useSkus";
import type { ServiceSku, PhotoRequirement, ChecklistItem, ServiceSkuInsert } from "@/hooks/useSkus";
import { Constants } from "@/integrations/supabase/types";

interface SkuFormSheetProps {
  sku: ServiceSku | null; // null = create mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultPhoto: PhotoRequirement = { label: "", when: "after", count: 1 };
const defaultChecklist: ChecklistItem = { label: "", required: false };

export function SkuFormSheet({ sku, open, onOpenChange }: SkuFormSheetProps) {
  const createSku = useCreateSku();
  const updateSku = useUpdateSku();
  const isEdit = !!sku;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");
  const [inclusions, setInclusions] = useState<string[]>([""]);
  const [exclusions, setExclusions] = useState<string[]>([""]);
  const [edgeCaseNotes, setEdgeCaseNotes] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [fulfillmentMode, setFulfillmentMode] = useState<string>("same_day_preferred");
  const [weatherSensitive, setWeatherSensitive] = useState(false);
  const [photos, setPhotos] = useState<PhotoRequirement[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [priceHintCents, setPriceHintCents] = useState<number | null>(null);
  const [pricingNotes, setPricingNotes] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (sku) {
      setName(sku.name);
      setDescription(sku.description ?? "");
      setCategory(sku.category ?? "");
      setStatus(sku.status);
      setInclusions(sku.inclusions?.length ? [...sku.inclusions] : [""]);
      setExclusions(sku.exclusions?.length ? [...sku.exclusions] : [""]);
      setEdgeCaseNotes(sku.edge_case_notes ?? "");
      setDurationMinutes(sku.duration_minutes);
      setFulfillmentMode(sku.fulfillment_mode);
      setWeatherSensitive(sku.weather_sensitive);
      setPhotos((sku.required_photos ?? []) as unknown as PhotoRequirement[]);
      setChecklist((sku.checklist ?? []) as unknown as ChecklistItem[]);
      setPriceHintCents(sku.price_hint_cents ?? null);
      setPricingNotes(sku.pricing_notes ?? "");
      setIsFeatured(sku.is_featured ?? false);
      setDisplayOrder(sku.display_order ?? 0);
    } else {
      setName(""); setDescription(""); setCategory(""); setStatus("draft");
      setInclusions([""]); setExclusions([""]); setEdgeCaseNotes("");
      setDurationMinutes(30); setFulfillmentMode("same_day_preferred");
      setWeatherSensitive(false); setPhotos([]); setChecklist([]);
      setPriceHintCents(null); setPricingNotes("");
      setIsFeatured(false); setDisplayOrder(0);
    }
  }, [open, sku]);

  const validate = () => {
    if (!name.trim()) return "Name is required";
    if (!description.trim()) return "Description is required";
    const validInc = inclusions.filter(s => s.trim());
    if (validInc.length === 0) return "At least one inclusion is required";
    const validExc = exclusions.filter(s => s.trim());
    if (validExc.length === 0) return "At least one exclusion is required";
    if (durationMinutes <= 0) return "Duration must be > 0";
    return null;
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingPayload = useRef<ServiceSkuInsert | null>(null);

  const buildPayload = (): ServiceSkuInsert => ({
    name: name.trim(),
    description: description.trim(),
    category: category.trim() || null,
    status,
    inclusions: inclusions.filter(s => s.trim()),
    exclusions: exclusions.filter(s => s.trim()),
    edge_case_notes: edgeCaseNotes.trim() || null,
    duration_minutes: durationMinutes,
    fulfillment_mode: fulfillmentMode as ServiceSkuInsert["fulfillment_mode"],
    weather_sensitive: weatherSensitive,
    required_photos: photos.filter(p => p.label.trim()) as unknown as ServiceSkuInsert["required_photos"],
    checklist: checklist.filter(c => c.label.trim()) as unknown as ServiceSkuInsert["checklist"],
    price_hint_cents: priceHintCents,
    pricing_notes: pricingNotes.trim() || null,
    is_featured: isFeatured,
    display_order: displayOrder,
  });

  const needsConfirmation = (payload: ServiceSkuInsert): boolean => {
    if (!isEdit || sku?.status !== "active") return false;
    const origPhotos = (sku.required_photos ?? []) as unknown as PhotoRequirement[];
    const origChecklist = (sku.checklist ?? []) as unknown as ChecklistItem[];
    const newPhotos = payload.required_photos as unknown as PhotoRequirement[];
    const newChecklist = payload.checklist as unknown as ChecklistItem[];
    if (sku.fulfillment_mode !== payload.fulfillment_mode) return true;
    if (origPhotos.length !== newPhotos.length) return true;
    if (origChecklist.length !== newChecklist.length) return true;
    return false;
  };

  const executeSave = (payload: ServiceSkuInsert) => {
    if (isEdit) {
      updateSku.mutate({ id: sku!.id, updates: payload }, {
        onSuccess: () => { toast.success("SKU updated"); onOpenChange(false); },
        onError: (e) => toast.error(e.message),
      });
    } else {
      createSku.mutate(payload, {
        onSuccess: () => { toast.success("SKU created"); onOpenChange(false); },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  const handleSave = () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    const payload = buildPayload();
    if (needsConfirmation(payload)) {
      pendingPayload.current = payload;
      setConfirmOpen(true);
    } else {
      executeSave(payload);
    }
  };

  const updateListItem = <T,>(list: T[], idx: number, val: T, setter: (v: T[]) => void) => {
    const copy = [...list]; copy[idx] = val; setter(copy);
  };
  const removeListItem = <T,>(list: T[], idx: number, setter: (v: T[]) => void) => {
    setter(list.filter((_, i) => i !== idx));
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit SKU" : "New SKU"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-4 pb-20">
          {/* Basics */}
          <CollapsibleSection title="Basics" defaultOpen>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Standard Mow" /></div>
              <div><Label>Description *</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
              <div><Label>Category</Label><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Exterior" /></div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Featured Service</Label>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" min={0} value={displayOrder} onChange={e => setDisplayOrder(Number(e.target.value))} placeholder="0" />
                <p className="text-caption mt-1">Lower numbers appear first within category.</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Scope */}
          <CollapsibleSection title="Scope" defaultOpen>
            <div className="space-y-3">
              <div>
                <Label>Inclusions *</Label>
                {inclusions.map((val, i) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Input value={val} onChange={e => updateListItem(inclusions, i, e.target.value, setInclusions)} placeholder="What's included" />
                    {inclusions.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeListItem(inclusions, i, setInclusions)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="mt-1 gap-1" onClick={() => setInclusions([...inclusions, ""])}><Plus className="h-3.5 w-3.5" /> Add</Button>
              </div>
              <div>
                <Label>Exclusions *</Label>
                {exclusions.map((val, i) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Input value={val} onChange={e => updateListItem(exclusions, i, e.target.value, setExclusions)} placeholder="What's not included" />
                    {exclusions.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeListItem(exclusions, i, setExclusions)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="mt-1 gap-1" onClick={() => setExclusions([...exclusions, ""])}><Plus className="h-3.5 w-3.5" /> Add</Button>
              </div>
              <div><Label>Edge-Case Notes</Label><Textarea value={edgeCaseNotes} onChange={e => setEdgeCaseNotes(e.target.value)} rows={2} /></div>
            </div>
          </CollapsibleSection>

          {/* Execution Rules */}
          <CollapsibleSection title="Execution Rules">
            <div className="space-y-3">
              <div><Label>Duration (minutes) *</Label><Input type="number" min={1} value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} /></div>
              <div>
                <Label>Fulfillment Mode</Label>
                <Select value={fulfillmentMode} onValueChange={setFulfillmentMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Constants.public.Enums.fulfillment_mode.map(m => (
                      <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Weather Sensitive</Label>
                <Switch checked={weatherSensitive} onCheckedChange={setWeatherSensitive} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Photos */}
          <CollapsibleSection title="Proof Requirements (Photos)">
            <div className="space-y-2">
              {photos.map((p, i) => (
                <div key={i} className="space-y-1.5 p-2 rounded-lg border border-border/50">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                    <div><Label className="text-xs">Label</Label><Input value={p.label} onChange={e => updateListItem(photos, i, { ...p, label: e.target.value }, setPhotos)} placeholder="e.g. Front yard" /></div>
                    <div>
                      <Label className="text-xs">When</Label>
                      <Select value={p.when} onValueChange={v => updateListItem(photos, i, { ...p, when: v as PhotoRequirement["when"] }, setPhotos)}>
                        <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before">Before</SelectItem>
                          <SelectItem value="after">After</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">#</Label><Input type="number" min={1} className="w-14" value={p.count} onChange={e => updateListItem(photos, i, { ...p, count: Number(e.target.value) }, setPhotos)} /></div>
                    <Button variant="ghost" size="icon" onClick={() => removeListItem(photos, i, setPhotos)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Input value={p.notes ?? ""} onChange={e => updateListItem(photos, i, { ...p, notes: e.target.value || undefined }, setPhotos)} placeholder="Optional photo instructions" className="h-9 text-sm" />
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setPhotos([...photos, { ...defaultPhoto }])}><Plus className="h-3.5 w-3.5" /> Add Photo Requirement</Button>
            </div>
          </CollapsibleSection>

          {/* Checklist */}
          <CollapsibleSection title="Checklist">
            <div className="space-y-2">
              {checklist.map((c, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={c.label} className="flex-1" onChange={e => updateListItem(checklist, i, { ...c, label: e.target.value }, setChecklist)} placeholder="Task item" />
                  <div className="flex items-center gap-1">
                    <Label className="text-xs whitespace-nowrap">Req</Label>
                    <Switch checked={c.required} onCheckedChange={v => updateListItem(checklist, i, { ...c, required: v }, setChecklist)} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeListItem(checklist, i, setChecklist)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setChecklist([...checklist, { ...defaultChecklist }])}><Plus className="h-3.5 w-3.5" /> Add Checklist Item</Button>
            </div>
          </CollapsibleSection>

          {/* Pricing */}
          <CollapsibleSection title="Pricing Metadata">
            <div className="space-y-3">
              <div>
                <Label>Price Hint ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={priceHintCents != null ? (priceHintCents / 100).toFixed(2) : ""}
                  onChange={e => {
                    const v = e.target.value;
                    setPriceHintCents(v ? Math.round(parseFloat(v) * 100) : null);
                  }}
                  placeholder="Optional"
                />
                <p className="text-caption mt-1">For internal reference only. Not shown to customers in billing.</p>
              </div>
              <div><Label>Pricing Notes</Label><Textarea value={pricingNotes} onChange={e => setPricingNotes(e.target.value)} rows={2} placeholder="Internal pricing context" /></div>
            </div>
          </CollapsibleSection>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={createSku.isPending || updateSku.isPending}>
            {isEdit ? "Save Changes" : "Create SKU"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm changes to active SKU</AlertDialogTitle>
          <AlertDialogDescription>
            You're changing the fulfillment mode, required photos, or checklist on an active SKU. This may affect in-progress jobs. Continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { if (pendingPayload.current) executeSave(pendingPayload.current); setConfirmOpen(false); }}>
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

function CollapsibleSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-semibold hover:text-accent transition-colors group">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
