import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CadenceType } from "@/hooks/useRoutine";
import { CADENCE_LABELS } from "@/hooks/useRoutinePreview";

interface CadencePickerProps {
  value: CadenceType;
  onChange: (cadence: CadenceType) => void;
  allowIndependent?: boolean;
}

const OPTIONS: { value: CadenceType; label: string }[] = [
  { value: "weekly", label: CADENCE_LABELS.weekly },
  { value: "biweekly", label: CADENCE_LABELS.biweekly },
  { value: "four_week", label: CADENCE_LABELS.four_week },
];

const INDEPENDENT_OPTIONS: { value: CadenceType; label: string }[] = [
  { value: "monthly", label: CADENCE_LABELS.monthly },
  { value: "quarterly", label: CADENCE_LABELS.quarterly },
];

export function CadencePicker({ value, onChange, allowIndependent = false }: CadencePickerProps) {
  const options = allowIndependent ? [...OPTIONS, ...INDEPENDENT_OPTIONS] : OPTIONS;

  return (
    <Select value={value} onValueChange={(v) => onChange(v as CadenceType)}>
      <SelectTrigger className="h-8 text-xs w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
