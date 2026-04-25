import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, Lightbulb } from "lucide-react";
import { useUpdateRoutineItemLevel } from "@/hooks/useRoutineActions";
import { useRoutine } from "@/hooks/useRoutine";
import { useProperty } from "@/hooks/useProperty";
import type { VisitDetail } from "@/hooks/useCustomerVisitDetail";

interface Props {
  courtesyUpgrade: VisitDetail["courtesyUpgrade"];
  recommendation: VisitDetail["recommendation"];
}

export function VisitDetailLevelCallouts({ courtesyUpgrade, recommendation }: Props) {
  const [dismissedRecommendation, setDismissedRecommendation] = useState(false);
  const { property } = useProperty();
  const { data: routineData } = useRoutine(property?.id);
  const updateLevel = useUpdateRoutineItemLevel();

  const handleUpdateLevel = (levelId: string, skuId: string) => {
    if (!routineData) {
      toast.error("No active routine found");
      return;
    }
    const item = routineData.items.find((i) => i.sku_id === skuId);
    if (!item) {
      toast.error("Service not found in your routine");
      return;
    }
    updateLevel.mutate(
      { itemId: item.id, levelId },
      {
        onSuccess: () => toast.success("Routine updated to new level"),
        onError: () => toast.error("Failed to update level"),
      }
    );
  };

  return (
    <>
      {courtesyUpgrade && (
        <Card className="p-4 space-y-2 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Courtesy Upgrade Applied</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                We upgraded you from {courtesyUpgrade.scheduled_level_label} to{" "}
                {courtesyUpgrade.performed_level_label} today so your home meets Handled standards.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Reason: {courtesyUpgrade.reason_code.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <Button
            variant="default"
            size="sm"
            className="w-full text-xs mt-2"
            disabled={updateLevel.isPending}
            onClick={() =>
              handleUpdateLevel(courtesyUpgrade.performed_level_id, courtesyUpgrade.sku_id)
            }
          >
            Update to {courtesyUpgrade.performed_level_label} going forward
          </Button>
        </Card>
      )}

      {recommendation && !courtesyUpgrade && !dismissedRecommendation && (
        <Card className="p-4 space-y-2 border-accent/30 bg-accent/5">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Provider Recommendation</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your provider recommends upgrading to {recommendation.recommended_level_label} for better results.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Reason: {recommendation.reason_code.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1 text-xs"
              disabled={updateLevel.isPending}
              onClick={() =>
                handleUpdateLevel(
                  recommendation.recommended_level_id,
                  recommendation.sku_id
                )
              }
            >
              Update going forward
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                setDismissedRecommendation(true);
                toast.info("Keeping current level");
              }}
            >
              Keep current level
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
