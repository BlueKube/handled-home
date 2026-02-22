import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateZone, useUpdateZone, type ZoneWithRegion } from "@/hooks/useZones";
import { useRegions } from "@/hooks/useRegions";
import { useZones } from "@/hooks/useZones";
import { useNonServicedZipDemand } from "@/hooks/useZoneInsights";
import { ZipSuggestions } from "./ZipSuggestions";
import { toast } from "sonner";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type DayOfWeek = Database["public"]["Enums"]["day_of_week"];

interface ZoneFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: ZoneWithRegion | null;
  prefillZips?: string[];
}

function normalizeZips(input: string): string[] {
  return input
    .split(/[,\s]+/)
    .map((s) => s.replace(/\D/g, ""))
    .filter((z) => z.length === 5)
    .filter((v, i, a) => a.indexOf(v) === i);
}

export function ZoneFormSheet({ open, onOpenChange, zone, prefillZips }: ZoneFormSheetProps) {
  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [zipInput, setZipInput] = useState("");
  const [day, setDay] = useState<DayOfWeek>("tuesday");
  const [window, setWindow] = useState<string>("any");
  const [status, setStatus] = useState("active");

  const { data: regions } = useRegions();
  const { data: allZones } = useZones();
  const { data: nonServiced } = useNonServicedZipDemand();
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const isEdit = !!zone;

  useEffect(() => {
    if (zone) {
      setName(zone.name);
      setRegionId(zone.region_id);
      setZipInput(zone.zip_codes.join(", "));
      setDay(zone.default_service_day);
      setWindow(zone.default_service_window || "any");
      setStatus(zone.status);
    } else {
      setName("");
      setRegionId(regions?.[0]?.id || "");
      setZipInput(prefillZips?.join(", ") || "");
      setDay("tuesday");
      setWindow("any");
      setStatus("active");
    }
  }, [zone, open, prefillZips, regions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const zips = normalizeZips(zipInput);
    if (!name.trim() || !regionId || !zips.length) {
      toast.error("Name, region, and at least one zip code are required");
      return;
    }

    const payload = {
      name: name.trim(),
      region_id: regionId,
      zip_codes: zips,
      default_service_day: day,
      default_service_window: window === "any" ? null : window,
      status,
    };

    try {
      if (isEdit) {
        await updateZone.mutateAsync({ id: zone!.id, ...payload });
        toast.success("Zone updated");
      } else {
        await createZone.mutateAsync(payload);
        toast.success("Zone created");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save zone");
    }
  };

  const currentZips = normalizeZips(zipInput);
  const isPending = createZone.isPending || updateZone.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl sm:max-w-lg sm:mx-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Zone" : "New Zone"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Zone Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Westlake Village – Tuesday" required />
          </div>

          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={regionId} onValueChange={setRegionId}>
              <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
              <SelectContent>
                {regions?.filter((r) => r.status === "active").map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Zip Codes</Label>
            <Textarea
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              placeholder="91361, 91362, 91377"
              rows={3}
            />
            <p className="text-caption">{currentZips.length} valid zip{currentZips.length !== 1 ? "s" : ""}</p>
            <ZipSuggestions
              currentZips={currentZips}
              allZoneZips={allZones?.filter((z) => z.id !== zone?.id).map((z) => z.zip_codes) || []}
              nonServicedZips={nonServiced?.map((n) => n.zip_code)}
              onAdd={(zip) => setZipInput((prev) => (prev ? prev + ", " + zip : zip))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Service Day</Label>
              <Select value={day} onValueChange={(v) => setDay(v as DayOfWeek)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.day_of_week.map((d) => (
                    <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Window</Label>
              <Select value={window} onValueChange={setWindow}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="am">AM</SelectItem>
                  <SelectItem value="pm">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expansion_planned">Expansion Planned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isPending} className="flex-1">{isPending ? "Saving…" : "Save"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
