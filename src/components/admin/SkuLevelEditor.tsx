import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useSkuLevels, useCreateLevel, useUpdateLevel, useDeleteLevel } from "@/hooks/useSkuLevels";
import type { SkuLevel, SkuLevelInsert } from "@/hooks/useSkuLevels";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LevelForm, defaultLevelForm, type LevelFormState } from "@/components/admin/SkuLevelForm";

interface SkuLevelEditorProps {
  skuId: string;
}

export function SkuLevelEditor({ skuId }: SkuLevelEditorProps) {
  const { data: levels = [], isLoading } = useSkuLevels(skuId);
  const createLevel = useCreateLevel();
  const updateLevel = useUpdateLevel();
  const deleteLevel = useDeleteLevel();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [form, setForm] = useState<LevelFormState>({ ...defaultLevelForm });

  const resetForm = () => {
    setForm({ ...defaultLevelForm });
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
    setForm({ ...defaultLevelForm });
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
