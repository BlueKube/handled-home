import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useSkuLevels, useCreateLevel, useUpdateLevel, useDeleteLevel } from "@/hooks/useSkuLevels";
import type { SkuLevel, SkuLevelInsert } from "@/hooks/useSkuLevels";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SkuLevelEditorProps {
  skuId: string;
}

interface LevelFormState {
  label: string;
  short_description: string;
  inclusions: string[];
  exclusions: string[];
  planned_minutes: number;
  proof_photo_min: number;
  handles_cost: number;
  is_active: boolean;
  effective_start_cycle: string;
}

const defaultForm: LevelFormState = {
  label: "",
  short_description: "",
  inclusions: [""],
  exclusions: [""],
  planned_minutes: 30,
  proof_photo_min: 1,
  handles_cost: 0,
  is_active: true,
  effective_start_cycle: "",
};

export function SkuLevelEditor({ skuId }: SkuLevelEditorProps) {
  const { data: levels = [], isLoading } = useSkuLevels(skuId);
  const createLevel = useCreateLevel();
  const updateLevel = useUpdateLevel();
  const deleteLevel = useDeleteLevel();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [form, setForm] = useState<LevelFormState>({ ...defaultForm });

  const resetForm = () => {
    setForm({ ...defaultForm });
    setEditingId(null);
    setAddMode(false);
  };

  const startEdit = (level: SkuLevel) => {
    setEditingId(level.id);
    setAddMode(false);
    setForm({
      label: level.label,
      short_description: level.short_description ?? "",
      inclusions: level.inclusions?.length ? [...level.inclusions] : [""],
      exclusions: level.exclusions?.length ? [...level.exclusions] : [""],
      planned_minutes: level.planned_minutes,
      proof_photo_min: level.proof_photo_min,
      handles_cost: level.handles_cost,
      is_active: level.is_active,
      effective_start_cycle: level.effective_start_cycle ?? "",
    });
  };

  const startAdd = () => {
    setAddMode(true);
    setEditingId(null);
    setForm({ ...defaultForm });
  };

  const handleSave = () => {
    if (!form.label.trim()) {
      toast.error("Level label is required");
      return;
    }

    const inclusions = form.inclusions.filter(s => s.trim());
    const exclusions = form.exclusions.filter(s => s.trim());

    if (editingId) {
      updateLevel.mutate(
        {
          id: editingId,
          skuId,
          updates: {
            label: form.label.trim(),
            short_description: form.short_description.trim() || null,
            inclusions,
            exclusions,
            planned_minutes: form.planned_minutes,
            proof_photo_min: form.proof_photo_min,
            handles_cost: form.handles_cost,
            is_active: form.is_active,
            effective_start_cycle: form.effective_start_cycle || null,
          },
        },
        {
          onSuccess: () => { toast.success("Level updated"); resetForm(); },
          onError: (e) => toast.error(e.message),
        }
      );
    } else {
      const nextNumber = levels.length > 0 ? Math.max(...levels.map(l => l.level_number)) + 1 : 1;
      createLevel.mutate(
        {
          sku_id: skuId,
          level_number: nextNumber,
          label: form.label.trim(),
          short_description: form.short_description.trim() || null,
          inclusions,
          exclusions,
          planned_minutes: form.planned_minutes,
          proof_photo_min: form.proof_photo_min,
          handles_cost: form.handles_cost,
          is_active: form.is_active,
          effective_start_cycle: form.effective_start_cycle || null,
        },
        {
          onSuccess: () => { toast.success("Level created"); resetForm(); },
          onError: (e) => toast.error(e.message),
        }
      );
    }
  };

  const handleDelete = (level: SkuLevel) => {
    deleteLevel.mutate(
      { id: level.id, skuId },
      {
        onSuccess: () => toast.success("Level deleted"),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const qc = useQueryClient();
  const handleReorder = (level: SkuLevel, direction: "up" | "down") => {
    const idx = levels.findIndex(l => l.id === level.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= levels.length) return;

    const other = levels[swapIdx];
    supabase.rpc("swap_sku_level_order", {
      p_level_a_id: level.id,
      p_level_b_id: other.id,
    } as any).then(({ error }: any) => {
      if (error) { toast.error(error.message); return; }
      qc.invalidateQueries({ queryKey: ["sku_levels", skuId] });
    });
  };

  const updateListItem = (list: string[], idx: number, val: string, setter: (v: string[]) => void) => {
    const copy = [...list]; copy[idx] = val; setter(copy);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading levels…</p>;

  const isEditing = editingId !== null || addMode;

  return (
    <div className="space-y-3">
      {levels.length === 0 && !addMode && (
        <p className="text-sm text-muted-foreground">No levels defined. This SKU uses base defaults.</p>
      )}

      {levels.map((level, idx) => (
        <Card key={level.id} className={editingId === level.id ? "ring-2 ring-primary" : ""}>
          {editingId === level.id ? (
            <CardContent className="pt-4">
              <LevelForm
                form={form}
                setForm={setForm}
                updateListItem={updateListItem}
                onSave={handleSave}
                onCancel={resetForm}
                isPending={updateLevel.isPending}
              />
            </CardContent>
          ) : (
            <CardContent className="p-3 flex items-start gap-2">
              <div className="flex flex-col gap-0.5 mt-1">
                <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0} onClick={() => handleReorder(level, "up")}>
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === levels.length - 1} onClick={() => handleReorder(level, "down")}>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">L{level.level_number}</Badge>
                  <span className="font-medium text-sm">{level.label}</span>
                  {!level.is_active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                </div>
                {level.short_description && (
                  <p className="text-xs text-muted-foreground mt-1">{level.short_description}</p>
                )}
                <div className="flex gap-2 mt-1.5 text-xs text-muted-foreground">
                  <span>{level.planned_minutes}min</span>
                  <span>·</span>
                  <span>{level.handles_cost} handles</span>
                  <span>·</span>
                  <span>{level.proof_photo_min} photos</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(level)} disabled={isEditing}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={isEditing}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{level.label}"?</AlertDialogTitle>
                      <AlertDialogDescription>This level will be permanently removed. Existing routine items using this level will fall back to SKU defaults.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(level)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {addMode && (
        <Card className="ring-2 ring-primary">
          <CardContent className="pt-4">
            <LevelForm
              form={form}
              setForm={setForm}
              updateListItem={updateListItem}
              onSave={handleSave}
              onCancel={resetForm}
              isPending={createLevel.isPending}
            />
          </CardContent>
        </Card>
      )}

      {!isEditing && levels.length < 4 && (
        <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={startAdd}>
          <Plus className="h-3.5 w-3.5" /> Add Level
        </Button>
      )}
    </div>
  );
}

function LevelForm({
  form,
  setForm,
  updateListItem,
  onSave,
  onCancel,
  isPending,
}: {
  form: LevelFormState;
  setForm: (f: LevelFormState) => void;
  updateListItem: (list: string[], idx: number, val: string, setter: (v: string[]) => void) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Label *</Label>
        <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Standard" />
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Textarea value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} rows={2} placeholder="Brief scope description" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Minutes</Label>
          <Input type="number" min={1} value={form.planned_minutes} onChange={e => setForm({ ...form, planned_minutes: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-xs">Handles Cost</Label>
          <Input type="number" min={0} value={form.handles_cost} onChange={e => setForm({ ...form, handles_cost: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-xs">Min Photos</Label>
          <Input type="number" min={0} value={form.proof_photo_min} onChange={e => setForm({ ...form, proof_photo_min: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Inclusions</Label>
        {form.inclusions.map((val, i) => (
          <div key={i} className="flex gap-1 mt-1">
            <Input value={val} onChange={e => {
              const c = [...form.inclusions]; c[i] = e.target.value;
              setForm({ ...form, inclusions: c });
            }} placeholder="What's included" className="h-9 text-sm" />
            {form.inclusions.length > 1 && (
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setForm({ ...form, inclusions: form.inclusions.filter((_, j) => j !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="sm" className="mt-1 gap-1 text-xs h-7" onClick={() => setForm({ ...form, inclusions: [...form.inclusions, ""] })}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      <div>
        <Label className="text-xs">Exclusions</Label>
        {form.exclusions.map((val, i) => (
          <div key={i} className="flex gap-1 mt-1">
            <Input value={val} onChange={e => {
              const c = [...form.exclusions]; c[i] = e.target.value;
              setForm({ ...form, exclusions: c });
            }} placeholder="What's not included" className="h-9 text-sm" />
            {form.exclusions.length > 1 && (
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setForm({ ...form, exclusions: form.exclusions.filter((_, j) => j !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="sm" className="mt-1 gap-1 text-xs h-7" onClick={() => setForm({ ...form, exclusions: [...form.exclusions, ""] })}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      <div>
        <Label className="text-xs">Effective Start Cycle</Label>
        <Input type="date" value={form.effective_start_cycle} onChange={e => setForm({ ...form, effective_start_cycle: e.target.value })} />
        <p className="text-[10px] text-muted-foreground mt-0.5">Optional. Leave blank for immediate availability.</p>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Active</Label>
        <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <Button size="sm" onClick={onSave} disabled={isPending} className="gap-1">
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1">
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
      </div>
    </div>
  );
}
