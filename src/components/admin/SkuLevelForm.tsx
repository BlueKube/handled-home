import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, X } from "lucide-react";

export interface LevelFormState {
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

export const defaultLevelForm: LevelFormState = {
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

export function LevelForm({
  form,
  setForm,
  onSave,
  onCancel,
  isPending,
}: {
  form: LevelFormState;
  setForm: (f: LevelFormState) => void;
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
