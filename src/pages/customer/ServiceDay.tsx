import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/hooks/useProperty";
import { useServiceDayAssignment } from "@/hooks/useServiceDayAssignment";
import { useServiceDayActions } from "@/hooks/useServiceDayActions";
import { useServiceDayCapacity } from "@/hooks/useServiceDayCapacity";
import { ServiceDayOfferCard } from "@/components/customer/ServiceDayOffer";
import { ServiceDayAlternatives } from "@/components/customer/ServiceDayAlternatives";
import { ServiceDayConfirmed } from "@/components/customer/ServiceDayConfirmed";
import { SchedulingPreferences, type SchedulingPrefs } from "@/components/customer/SchedulingPreferences";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { HelpTip } from "@/components/ui/help-tip";

export default function CustomerServiceDay() {
  const { property, isLoading: propLoading } = useProperty();
  const { assignment, offers, isLoading: assignLoading, expiredPrevious, refetch } = useServiceDayAssignment(property?.id);
  const {
    createOrRefreshOffer,
    confirmServiceDay,
    rejectServiceDay,
    selectAlternative,
    savePreferences,
  } = useServiceDayActions();

  // L10: Get capacity utilization for the offered day
  const { capacities } = useServiceDayCapacity(assignment?.zone_id ?? null);
  const primaryOffer = offers.find((o) => o.offer_type === "primary");
  const offeredDay = primaryOffer?.offered_day_of_week ?? assignment?.day_of_week;
  const offeredCap = capacities.find((c) => c.day_of_week === offeredDay);
  const capacityUtilization = offeredCap
    ? Math.round((offeredCap.assigned_count / Math.max(1, offeredCap.max_homes + Math.floor(offeredCap.max_homes * offeredCap.buffer_percent / 100))) * 100)
    : undefined;

  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showExpiredMessage, setShowExpiredMessage] = useState(false);
  const [prefs, setPrefs] = useState<SchedulingPrefs>({
    align_days_preference: false,
    must_be_home: false,
    must_be_home_window: null,
  });

  // D1.5-F1: Load saved preferences from DB
  const { data: savedPrefs } = useQuery({
    queryKey: ["service_day_prefs", property?.id],
    enabled: !!property?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_day_preferences")
        .select("align_days_preference, must_be_home, must_be_home_window")
        .eq("property_id", property!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (savedPrefs) {
      setPrefs({
        align_days_preference: savedPrefs.align_days_preference,
        must_be_home: savedPrefs.must_be_home,
        must_be_home_window: savedPrefs.must_be_home_window,
      });
    }
  }, [savedPrefs]);

  // Save preferences when toggled
  const handlePrefsChange = (newPrefs: SchedulingPrefs) => {
    setPrefs(newPrefs);
    if (property?.id) {
      savePreferences.mutate({
        propertyId: property.id,
        alignDaysPreference: newPrefs.align_days_preference,
        mustBeHome: newPrefs.must_be_home,
        mustBeHomeWindow: newPrefs.must_be_home ? newPrefs.must_be_home_window : null,
      });
    }
  };

  // D1.5-F4: Ref guard for auto-create offer
  const offerCreated = useRef(false);

  // Auto-create offer on mount if no assignment exists
  useEffect(() => {
    if (!propLoading && !assignLoading && property?.id && !assignment && !offerCreated.current) {
      offerCreated.current = true;
      // M4: Show expiry message if a previous offer expired
      if (expiredPrevious) {
        setShowExpiredMessage(true);
      }
      createOrRefreshOffer.mutate(property.id, {
        onSuccess: () => refetch(),
      });
    }
  }, [propLoading, assignLoading, property?.id, assignment, expiredPrevious]);

  // Show alternatives after rejection
  useEffect(() => {
    if (assignment?.rejection_used) {
      setShowAlternatives(true);
    }
  }, [assignment?.rejection_used]);

  if (propLoading || assignLoading || createOrRefreshOffer.isPending) {
    return (
      <div className="p-4 pb-24 space-y-4">
        {/* M4: Calm expiry message */}
        {showExpiredMessage && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your previous offer expired, so we refreshed your Service Day options.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center gap-3 justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-caption">We're matching you to the best route…</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-4 pb-24">
        <p className="text-caption text-center py-12">
          Unable to generate a service day offer. Please ensure you have an active subscription.
        </p>
      </div>
    );
  }

  // Confirmed state
  if (assignment.status === "confirmed") {
    return (
      <div className="p-4 pb-24 animate-fade-in space-y-6">
        <div className="flex items-center gap-1 mb-1">
          <h1 className="text-h2">Your Service Day</h1>
          <HelpTip text="Your recommended day is optimized for route efficiency — choosing it helps your provider serve your neighborhood faster." />
        </div>
        <ServiceDayConfirmed dayOfWeek={assignment.day_of_week} />
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Scheduling preferences</h3>
          <SchedulingPreferences
            value={prefs}
            onChange={handlePrefsChange}
            alignmentExplanation={assignment.alignment_explanation}
          />
        </div>
      </div>
    );
  }

  // Alternatives view (after rejection)
  const alternatives = offers.filter((o) => o.offer_type === "alternative");
  if (showAlternatives && assignment.rejection_used) {
    return (
      <div className="p-4 pb-24 animate-fade-in">
        <ServiceDayAlternatives
          alternatives={alternatives}
          onSelect={(offerId) =>
            selectAlternative.mutate(
              { assignmentId: assignment.id, offerId },
              { onSuccess: () => refetch() }
            )
          }
          isSelecting={selectAlternative.isPending}
          onSavePreferences={
            property
              ? (days) => savePreferences.mutate({ propertyId: property.id, days })
              : undefined
          }
        />
      </div>
    );
  }

  // Offer pending state
  return (
    <div className="p-4 pb-24 animate-fade-in space-y-6">
      {/* M4: Calm expiry message */}
      {showExpiredMessage && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your previous offer expired, so we refreshed your Service Day options.
          </AlertDescription>
        </Alert>
      )}
      <ServiceDayOfferCard
        assignment={assignment}
        offers={offers}
        onConfirm={() =>
          confirmServiceDay.mutate(assignment.id, { onSuccess: () => refetch() })
        }
        onReject={() =>
          rejectServiceDay.mutate(assignment.id, {
            onSuccess: () => {
              setShowAlternatives(true);
              refetch();
            },
          })
        }
        isConfirming={confirmServiceDay.isPending}
        isRejecting={rejectServiceDay.isPending}
        capacityUtilization={capacityUtilization}
      />

      {/* D1.5: Scheduling preferences */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Scheduling preferences</h3>
        <SchedulingPreferences
          value={prefs}
          onChange={handlePrefsChange}
          alignmentExplanation={assignment.alignment_explanation}
        />
      </div>
    </div>
  );
}
