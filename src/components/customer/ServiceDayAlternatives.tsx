import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarDays, HelpCircle } from "lucide-react";
import type { ServiceDayOffer } from "@/hooks/useServiceDayAssignment";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ServiceDayAlternativesProps {
  alternatives: ServiceDayOffer[];
  onSelect: (offerId: string) => void;
  isSelecting: boolean;
  onSavePreferences?: (days: string[]) => void;
}

const ALL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ServiceDayAlternatives({
  alternatives,
  onSelect,
  isSelecting,
  onSavePreferences,
}: ServiceDayAlternativesProps) {
  const navigate = useNavigate();
  const [prefDays, setPrefDays] = useState<string[]>([]);

  if (alternatives.length === 0) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">No alternatives available</h2>
            <p className="text-caption">All service days in your zone are currently full.</p>
          </div>
        </div>

        {onSavePreferences && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Tell us your preferred days so we can prioritize you:</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_DAYS.map((day) => (
                <label key={day} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={prefDays.includes(day)}
                    onCheckedChange={(checked) =>
                      setPrefDays((prev) =>
                        checked ? [...prev, day] : prev.filter((d) => d !== day)
                      )
                    }
                  />
                  <Label className="cursor-pointer">{capitalize(day)}</Label>
                </label>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => onSavePreferences(prefDays)}
              disabled={prefDays.length === 0}
              className="w-full"
            >
              Save Preferences
            </Button>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={() => navigate("/customer/support")}>
          Contact Support
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Choose an alternative</h2>
        <p className="text-caption">Pick the day that works best for you.</p>
      </div>

      <div className="space-y-2">
        {alternatives.map((alt) => (
          <Button
            key={alt.id}
            variant="outline"
            onClick={() => onSelect(alt.id)}
            disabled={isSelecting}
            className="w-full justify-start gap-3"
          >
            <CalendarDays className="h-4 w-4 text-accent" />
            {capitalize(alt.offered_day_of_week)}
            {alt.offered_window !== "any" && (
              <span className="text-muted-foreground text-sm">({alt.offered_window})</span>
            )}
          </Button>
        ))}
      </div>
    </Card>
  );
}
