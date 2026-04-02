import { useState, useEffect, useRef } from "react";
import { useProperty } from "@/hooks/useProperty";
import { useServiceDayAssignment } from "@/hooks/useServiceDayAssignment";
import { useServiceDayActions } from "@/hooks/useServiceDayActions";
import { useServiceDayCapacity } from "@/hooks/useServiceDayCapacity";
import { SchedulingPreferences as SchedulingPreferencesComponent, type SchedulingPrefs } from "@/components/customer/SchedulingPreferences";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarCheck, Zap, Loader2 } from "lucide-react";
import { capitalize } from "./shared";

export function ServiceDayStep({ onComplete }: { onComplete: () => Promise<void> }) {
  const [completing, setCompleting] = useState(false);
  const { property } = useProperty();
  const { assignment, offers, isLoading: assignLoading, refetch } = useServiceDayAssignment(property?.id);
  const { createOrRefreshOffer, confirmServiceDay, savePreferences } = useServiceDayActions();
  const { capacities } = useServiceDayCapacity(assignment?.zone_id ?? null);
  const [prefs, setPrefs] = useState<SchedulingPrefs>({ align_days_preference: false, must_be_home: false, must_be_home_window: null });
  const offerCreated = useRef(false);

  useEffect(() => {
    if (!assignLoading && property?.id && !assignment && !offerCreated.current) {
      offerCreated.current = true;
      createOrRefreshOffer.mutate(property.id, { onSuccess: () => refetch() });
    }
  }, [assignLoading, property?.id, assignment]);

  const primaryOffer = offers.find((o) => o.offer_type === "primary");
  const offeredDay = primaryOffer?.offered_day_of_week ?? assignment?.day_of_week;
  const offeredCap = capacities.find((c) => c.day_of_week === offeredDay);
  const capacityUtilization = offeredCap
    ? Math.round((offeredCap.assigned_count / Math.max(1, offeredCap.max_homes + Math.floor(offeredCap.max_homes * offeredCap.buffer_percent / 100))) * 100)
    : undefined;

  const handleAccept = async () => {
    setCompleting(true);
    try {
      if (property?.id) {
        await savePreferences.mutateAsync({
          propertyId: property.id, alignDaysPreference: prefs.align_days_preference,
          mustBeHome: prefs.must_be_home, mustBeHomeWindow: prefs.must_be_home ? prefs.must_be_home_window : null,
        });
      }
      if (assignment && assignment.status === "offered") {
        await confirmServiceDay.mutateAsync(assignment.id);
      }
      await onComplete();
    } catch { /* Errors handled by mutation toasts */ } finally { setCompleting(false); }
  };

  if (assignLoading || createOrRefreshOffer.isPending) {
    return (
      <div className="space-y-4 text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
        <p className="text-sm text-muted-foreground">Finding the best route day for your area…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CalendarCheck className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Your Service Day</h1>
        <p className="text-muted-foreground text-sm mt-1">We match you to the most efficient route day — so your provider arrives on time, every time.</p>
      </div>
      {assignment && offeredDay && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-xs font-medium text-accent uppercase tracking-wide">System Recommended</span>
          </div>
          <div className="text-center py-3">
            <p className="text-3xl font-bold text-accent">{capitalize(offeredDay)}</p>
            {capacityUtilization != null && capacityUtilization < 70 && <p className="text-xs text-muted-foreground mt-1">Stable day — plenty of availability</p>}
            {capacityUtilization != null && capacityUtilization >= 70 && capacityUtilization < 90 && <p className="text-xs text-muted-foreground mt-1">Popular day in your area</p>}
          </div>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">This day has the best route density in your neighborhood, which means reliable, on-time service.</p>
        </Card>
      )}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Scheduling preferences</h3>
        <SchedulingPreferencesComponent value={prefs} onChange={setPrefs}
          alignmentExplanation={prefs.align_days_preference ? assignment?.alignment_explanation ?? null : null} compact />
      </div>
      <Button className="w-full h-12 text-base font-semibold rounded-xl" onClick={handleAccept} disabled={completing}>
        {completing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Accept & Continue
      </Button>
      <Button variant="ghost" className="w-full text-sm" onClick={async () => {
        setCompleting(true);
        try { await onComplete(); } finally { setCompleting(false); }
      }} disabled={completing}>Skip for now — I'll set this up later</Button>
    </div>
  );
}
