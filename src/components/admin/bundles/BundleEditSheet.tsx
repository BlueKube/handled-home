import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateBundle,
  useUpdateBundle,
  useReplaceBundleItems,
  usePromoteBundle,
  useArchiveBundle,
  type ItemInput,
} from "@/hooks/useAdminBundleMutations";
import type { AdminBundle } from "@/hooks/useAdminBundles";
import { useZones } from "@/hooks/useZones";
import { slugify } from "@/lib/bundleSlug";
import { computeBundleSavings } from "@/lib/bundleSavings";

interface BundleEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // null = creating new; non-null = editing existing
  bundle: AdminBundle | null;
}

const SEASONS: Array<"fall" | "winter" | "spring" | "summer"> = [
  "fall",
  "winter",
  "spring",
  "summer",
];

interface DraftState {
  name: string;
  slug: string;
  season: AdminBundle["season"];
  window_start_date: string;
  window_end_date: string;
  description: string;
  hero_image_path: string;
  total_credits: number;
  zone_ids: string[];
  items: ItemInput[];
}

function defaultDraft(): DraftState {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + 90 * 86400 * 1000)
    .toISOString()
    .slice(0, 10);
  return {
    name: "",
    slug: "",
    season: "fall",
    window_start_date: start,
    window_end_date: end,
    description: "",
    hero_image_path: "",
    total_credits: 0,
    zone_ids: [],
    items: [],
  };
}

function bundleToDraft(b: AdminBundle): DraftState {
  return {
    name: b.name,
    slug: b.slug,
    season: b.season,
    window_start_date: b.window_start_date,
    window_end_date: b.window_end_date,
    description: b.description ?? "",
    hero_image_path: b.hero_image_path ?? "",
    total_credits: b.total_credits,
    zone_ids: [...b.zone_ids],
    items: b.bundle_items.map((it) => ({
      label: it.label,
      est_minutes: it.est_minutes,
      credits: it.credits,
      sort_order: it.sort_order,
      sku_id: it.sku_id,
    })),
  };
}

export function BundleEditSheet({ open, onOpenChange, bundle }: BundleEditSheetProps) {
  const isEditing = bundle !== null;
  const [draft, setDraft] = useState<DraftState>(() => defaultDraft());
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: zones } = useZones();
  const create = useCreateBundle();
  const update = useUpdateBundle();
  const replaceItems = useReplaceBundleItems();
  const promote = usePromoteBundle();
  const archive = useArchiveBundle();

  // Sync draft when the bundle prop changes (open/close cycle).
  useEffect(() => {
    if (open) {
      setDraft(bundle ? bundleToDraft(bundle) : defaultDraft());
      setSlugTouched(false);
    }
  }, [open, bundle]);

  // Auto-derive slug from name unless the admin has explicitly edited it.
  // Slug is also locked once the bundle has been saved (isEditing) — changing
  // an existing slug would break in-flight customer URLs.
  useEffect(() => {
    if (isEditing) return;
    if (slugTouched) return;
    setDraft((d) => ({ ...d, slug: slugify(d.name) }));
  }, [isEditing, slugTouched, draft.name]);

  const separateCredits = useMemo(
    () => draft.items.reduce((acc, it) => acc + it.credits, 0),
    [draft.items],
  );
  const savings = useMemo(() => {
    if (separateCredits < draft.total_credits) {
      return { saveCredits: 0, savePercent: 0, invalid: true };
    }
    return { ...computeBundleSavings({
      totalCredits: draft.total_credits,
      separateCredits,
    }), invalid: false };
  }, [separateCredits, draft.total_credits]);

  const isPending =
    create.isPending ||
    update.isPending ||
    replaceItems.isPending ||
    promote.isPending ||
    archive.isPending;

  const validate = (): string | null => {
    if (!draft.name.trim()) return "Name is required.";
    if (!draft.slug.trim()) return "Slug is required.";
    if (draft.window_end_date < draft.window_start_date)
      return "Window end must be on or after start.";
    if (draft.total_credits <= 0) return "Total credits must be > 0.";
    if (separateCredits < draft.total_credits)
      return `Total (${draft.total_credits}) cannot exceed sum of items (${separateCredits}).`;
    for (const it of draft.items) {
      if (!it.label.trim()) return "Every line item needs a label.";
      if (it.est_minutes <= 0) return "Every line item needs est_minutes > 0.";
      if (it.credits <= 0) return "Every line item needs credits > 0.";
    }
    return null;
  };

  const handleSave = async (alsoActivate = false) => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    // Save flow (review SF-1): persist items first so separate_credits
    // matches the new total before metadata UPDATE writes the new
    // total_credits — avoids tripping CHECK (separate_credits >= total_credits)
    // when raising total_credits while items also grow.
    try {
      let bundleId: string;
      if (isEditing && bundle) {
        bundleId = bundle.id;
        // Replace items first (RPC is atomic — Lane 4 MF-1).
        await replaceItems.mutateAsync({ bundleId, items: draft.items });
        await update.mutateAsync({
          id: bundleId,
          name: draft.name.trim(),
          season: draft.season,
          window_start_date: draft.window_start_date,
          window_end_date: draft.window_end_date,
          description: draft.description.trim() || null,
          hero_image_path: draft.hero_image_path.trim() || null,
          total_credits: draft.total_credits,
          zone_ids: draft.zone_ids,
        });
      } else {
        const created = await create.mutateAsync({
          slug: draft.slug.trim(),
          name: draft.name.trim(),
          season: draft.season,
          window_start_date: draft.window_start_date,
          window_end_date: draft.window_end_date,
          description: draft.description.trim() || null,
          hero_image_path: draft.hero_image_path.trim() || null,
          total_credits: draft.total_credits,
          zone_ids: draft.zone_ids,
        });
        bundleId = created.id;
        await replaceItems.mutateAsync({ bundleId, items: draft.items });
      }

      if (alsoActivate) {
        await promote.mutateAsync(bundleId);
      }

      toast.success(
        alsoActivate
          ? "Bundle saved and activated."
          : isEditing
            ? "Bundle saved."
            : "Bundle created as draft.",
      );
      onOpenChange(false);
    } catch (e) {
      // Lane 4 MF-2: detect Postgres unique-violation (23505) and surface a
      // human message instead of the raw "duplicate key value violates
      // unique constraint" wire string.
      const errObj = e as { code?: string; message?: string };
      const isDuplicateSlug =
        errObj?.code === "23505" ||
        (errObj?.message?.includes("duplicate key") ?? false) ||
        (errObj?.message?.includes("bundles_slug_key") ?? false);
      const msg = isDuplicateSlug
        ? "A bundle with this slug already exists. Pick a different name or edit the slug."
        : e instanceof Error
          ? e.message
          : "Save failed.";
      toast.error(msg);
    }
  };

  const handleArchive = async () => {
    if (!isEditing || !bundle) return;
    if (!window.confirm(`Archive "${bundle.name}"? Customers will stop seeing it.`))
      return;
    try {
      await archive.mutateAsync(bundle.id);
      toast.success("Bundle archived.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Archive failed.");
    }
  };

  const addItem = () => {
    setDraft((d) => ({
      ...d,
      items: [
        ...d.items,
        {
          label: "",
          est_minutes: 30,
          credits: 100,
          sort_order: d.items.length + 1,
          sku_id: null,
        },
      ],
    }));
  };

  const updateItem = (idx: number, patch: Partial<ItemInput>) => {
    setDraft((d) => ({
      ...d,
      items: d.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  };

  const removeItem = (idx: number) => {
    setDraft((d) => ({
      ...d,
      items: d.items.filter((_, i) => i !== idx),
    }));
  };

  const toggleZone = (zoneId: string) => {
    setDraft((d) => ({
      ...d,
      zone_ids: d.zone_ids.includes(zoneId)
        ? d.zone_ids.filter((z) => z !== zoneId)
        : [...d.zone_ids, zoneId],
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>
            {isEditing ? `Edit ${bundle?.name ?? "bundle"}` : "New seasonal bundle"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {/* Identity */}
          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="bundle-name">Name *</Label>
                <Input
                  id="bundle-name"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Fall Prep"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="bundle-slug">Slug</Label>
                <Input
                  id="bundle-slug"
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setDraft((d) => ({ ...d, slug: slugify(e.target.value) }));
                  }}
                  placeholder="fall-prep-2026"
                  disabled={isEditing || isPending}
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Slug locked after first save — changing it would break customer URLs.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Season *</Label>
                <Select
                  value={draft.season}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, season: v as DraftState["season"] }))
                  }
                  disabled={isPending}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEASONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bundle-total">Total credits *</Label>
                <Input
                  id="bundle-total"
                  type="number"
                  min={1}
                  value={draft.total_credits}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      total_credits: Number.isFinite(Number(e.target.value))
                        ? Number(e.target.value)
                        : 0,
                    }))
                  }
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bundle-start">Window start *</Label>
                <Input
                  id="bundle-start"
                  type="date"
                  value={draft.window_start_date}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, window_start_date: e.target.value }))
                  }
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bundle-end">Window end *</Label>
                <Input
                  id="bundle-end"
                  type="date"
                  value={draft.window_end_date}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, window_end_date: e.target.value }))
                  }
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="bundle-description">Description</Label>
                <Textarea
                  id="bundle-description"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder="Get your home ready before the cold sets in…"
                  rows={3}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="bundle-hero">Hero image URL (optional)</Label>
                <Input
                  id="bundle-hero"
                  value={draft.hero_image_path}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, hero_image_path: e.target.value }))
                  }
                  placeholder="https://…/fall-prep.jpg"
                  disabled={isPending}
                />
              </div>
            </div>
          </section>

          {/* Zones */}
          <section className="space-y-2">
            <Label>Zones</Label>
            <p className="text-xs text-muted-foreground">
              Pick zones where this bundle should appear for customers.
            </p>
            <div className="flex flex-wrap gap-2">
              {(zones ?? []).map((z) => {
                const active = draft.zone_ids.includes(z.id);
                return (
                  <Badge
                    key={z.id}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    role="checkbox"
                    aria-checked={active}
                    tabIndex={isPending ? -1 : 0}
                    onClick={() => !isPending && toggleZone(z.id)}
                    onKeyDown={(e) => {
                      if (isPending) return;
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        toggleZone(z.id);
                      }
                    }}
                  >
                    {z.name}
                  </Badge>
                );
              })}
              {(zones ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No zones available.</p>
              )}
            </div>
          </section>

          {/* Line items */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line items</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={isPending}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add row
              </Button>
            </div>
            {draft.items.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No items yet. Add at least one before activating.
              </p>
            ) : (
              <div className="space-y-2">
                {draft.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center rounded-lg border border-border bg-card p-2"
                  >
                    <Input
                      className="col-span-5"
                      placeholder="Label"
                      value={item.label}
                      onChange={(e) => updateItem(idx, { label: e.target.value })}
                      disabled={isPending}
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      min={1}
                      placeholder="Min"
                      value={item.est_minutes}
                      onChange={(e) =>
                        updateItem(idx, {
                          est_minutes: Number(e.target.value) || 0,
                        })
                      }
                      disabled={isPending}
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      min={1}
                      placeholder="Cr"
                      value={item.credits}
                      onChange={(e) =>
                        updateItem(idx, { credits: Number(e.target.value) || 0 })
                      }
                      disabled={isPending}
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      min={0}
                      placeholder="Order"
                      value={item.sort_order}
                      onChange={(e) =>
                        updateItem(idx, { sort_order: Number(e.target.value) || 0 })
                      }
                      disabled={isPending}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={isPending}
                      aria-label="Remove row"
                      className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Savings preview */}
          <section className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1">
            <p className="text-xs font-medium">Savings preview</p>
            <p className="text-xs text-muted-foreground">
              Separate (sum of items): {separateCredits} cr · Total:{" "}
              {draft.total_credits} cr
            </p>
            {savings.invalid ? (
              <p className="text-xs text-destructive">
                Total credits exceeds sum of items — save will be rejected.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Customer sees: Save {savings.saveCredits} credits ({savings.savePercent}%
                off)
              </p>
            )}
          </section>

          {/* Footer */}
          <div className="flex flex-wrap gap-2 sticky bottom-0 bg-background py-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <div className="flex-1" />
            {isEditing && bundle && bundle.status !== "archived" && (
              <Button
                variant="ghost"
                onClick={handleArchive}
                disabled={isPending}
                className="text-destructive"
              >
                Archive
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save as draft
            </Button>
            {(!isEditing || bundle?.status !== "active") && (
              <Button
                onClick={() => handleSave(true)}
                disabled={isPending || draft.items.length === 0}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save & Activate
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
