import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useZones } from "@/hooks/useZones";
import { type ZoneTabProps } from "./shared";

export function ZoneFilter({ selectedZone, setSelectedZone }: ZoneTabProps) {
  const zonesQuery = useZones();
  const zones = zonesQuery.data;
  return (
    <Select value={selectedZone} onValueChange={setSelectedZone}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="All zones" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All zones</SelectItem>
        {zones?.map((z: any) => (
          <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
