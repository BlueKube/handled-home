import { useEffect, useState } from "react";
import { useProperty } from "@/hooks/useProperty";
import { useServiceDayAssignment } from "@/hooks/useServiceDayAssignment";
import { useServiceDayActions } from "@/hooks/useServiceDayActions";
import { useServiceDayCapacity } from "@/hooks/useServiceDayCapacity";
import { ServiceDayOfferCard } from "@/components/customer/ServiceDayOffer";
import { ServiceDayAlternatives } from "@/components/customer/ServiceDayAlternatives";
import { ServiceDayConfirmed } from "@/components/customer/ServiceDayConfirmed";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";

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

  // Auto-create offer on mount if no assignment exists
  useEffect(() => {
    if (!propLoading && !assignLoading && property?.id && !assignment) {
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
      <div className="p-6 max-w-md mx-auto space-y-4">
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
      <div className="p-6 max-w-md mx-auto">
        <p className="text-caption text-center py-12">
          Unable to generate a service day offer. Please ensure you have an active subscription.
        </p>
      </div>
    );
  }

  // Confirmed state
  if (assignment.status === "confirmed") {
    return (
      <div className="p-6 max-w-md mx-auto animate-fade-in">
        <ServiceDayConfirmed dayOfWeek={assignment.day_of_week} />
      </div>
    );
  }

  // Alternatives view (after rejection)
  const alternatives = offers.filter((o) => o.offer_type === "alternative");
  if (showAlternatives && assignment.rejection_used) {
    return (
      <div className="p-6 max-w-md mx-auto animate-fade-in">
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
    <div className="p-6 max-w-md mx-auto animate-fade-in">
      {/* M4: Calm expiry message */}
      {showExpiredMessage && (
        <Alert className="mb-4">
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
    </div>
  );
}
