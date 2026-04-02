import { useState } from "react";
import { Home, Clock, Calendar, Sparkles, Loader2, Check, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useHomeAssistantSkus, useHomeAssistantWindows, useBookHomeAssistant, type HomeAssistantSku, type BookingWindow } from "@/hooks/useHomeAssistant";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useHandleBalance } from "@/hooks/useHandles";
import { useProperty } from "@/hooks/useProperty";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export default function HomeAssistantBooking() {
  const { data: skus = [], isLoading: skusLoading } = useHomeAssistantSkus();
  const { data: subscription } = useCustomerSubscription();
  const { data: handleBalance } = useHandleBalance();
  const { property } = useProperty();
  const { data: windows = [] } = useHomeAssistantWindows(subscription?.zone_id);
  const book = useBookHomeAssistant();

  const [selectedSku, setSelectedSku] = useState<HomeAssistantSku | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<BookingWindow | null>(null);
  const [booking, setBooking] = useState(false);

  const isActiveMember = subscription?.status === "active" || subscription?.status === "trialing";

  const handleBook = async (paymentMethod: "handles" | "cash") => {
    if (!subscription || !property || !selectedSku || !selectedWindow) return;
    setBooking(true);
    try {
      const result = await book.mutateAsync({
        subscriptionId: subscription.id,
        skuId: selectedSku.id,
        propertyId: property.id,
        zoneId: subscription.zone_id!,
        windowId: selectedWindow.id,
        paymentMethod,
      });
      toast.success(`${selectedSku.name} booked for ${format(parseISO(result.window_date), "EEE, MMM d")} (${result.window_slot})!`);
      setSelectedSku(null);
      setSelectedWindow(null);
    } catch (err: any) {
      toast.error(err.message ?? "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  const canAfford = (sku: HomeAssistantSku) => (handleBalance ?? 0) >= (sku.handle_cost ?? 0);

  const timeLabel = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  if (!isActiveMember) {
    return (
      <div className="p-4 pb-24 space-y-4 animate-fade-in">
        <h1 className="text-h2 flex items-center gap-2"><Home className="h-5 w-5" /> Home Assistant</h1>
        <Card className="border-accent/20">
          <CardContent className="py-6 text-center space-y-3">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-medium">Members Only</p>
            <p className="text-sm text-muted-foreground">
              Home Assistant is exclusively available to active Handled Home members. Subscribe to unlock in-home help.
            </p>
            <Button variant="default" onClick={() => window.location.href = "/customer/plans"}>
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-h2 flex items-center gap-2"><Home className="h-5 w-5" /> Home Assistant</h1>
        <p className="text-caption mt-1">Scheduled in-home help. Book as soon as tomorrow.</p>
      </div>

      {/* Privacy & Trust Banner */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="py-3 flex items-start gap-3">
          <Shield className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium">Trust & Privacy</p>
            <p className="text-xs text-muted-foreground">
              All Home Assistants are vetted with enhanced trust checks. Photos follow privacy-safe rules — only approved areas captured.
            </p>
          </div>
        </CardContent>
      </Card>

      {skusLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="py-4 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-20" /></CardContent></Card>
          ))}
        </div>
      ) : skus.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Home Assistant services coming soon to your area.</p>
      ) : (
        <div className="space-y-3">
          {skus.map((sku) => (
            <Card
              key={sku.id}
              className="cursor-pointer hover:border-accent/40 transition-colors"
              onClick={() => { setSelectedSku(sku); setSelectedWindow(null); }}
            >
              <CardContent className="py-4 flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{sku.name}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      <Clock className="h-3 w-3 mr-0.5" />{timeLabel(sku.duration_minutes)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{sku.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{sku.handle_cost} handles</Badge>
                    <span className="text-[10px] text-muted-foreground">${(sku.base_price_cents / 100).toFixed(0)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0">Book →</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Sheet */}
      <Sheet open={!!selectedSku} onOpenChange={(open) => { if (!open) { setSelectedSku(null); setSelectedWindow(null); } }}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          {selectedSku && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedSku.name}</SheetTitle>
                <SheetDescription>{selectedSku.description}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 mt-4">
                {/* Time & Price */}
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{timeLabel(selectedSku.duration_minutes)}</Badge>
                  <Badge variant="outline">{selectedSku.handle_cost} handles</Badge>
                  <span className="text-muted-foreground">${(selectedSku.base_price_cents / 100).toFixed(2)}</span>
                </div>

                {/* What's Included */}
                {selectedSku.inclusions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted-foreground">Includes</p>
                    <ul className="space-y-1">
                      {selectedSku.inclusions.map((inc, i) => (
                        <li key={i} className="text-xs flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-primary shrink-0" /> {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Not Included */}
                {selectedSku.exclusions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted-foreground">Not Included</p>
                    <ul className="space-y-1">
                      {selectedSku.exclusions.map((exc, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="text-muted-foreground/50">✕</span> {exc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Customer Prep */}
                {(selectedSku.customer_prep as string[])?.length > 0 && (
                  <div className="bg-warning/10 rounded-lg p-3">
                    <p className="text-xs font-semibold mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-warning" /> Before Your Session
                    </p>
                    <ul className="space-y-1">
                      {(selectedSku.customer_prep as string[]).map((prep, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {prep}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Window Selection */}
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">
                    <Calendar className="h-3 w-3 inline mr-1" />Available Windows
                  </p>
                  {windows.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3">No windows available in your area right now. Check back soon.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {windows.map((w) => {
                        const isSelected = selectedWindow?.id === w.id;
                        const spotsLeft = w.capacity - w.booked;
                        return (
                          <button
                            key={w.id}
                            onClick={() => setSelectedWindow(w)}
                            className={`rounded-lg border p-3 text-left transition-colors ${
                              isSelected ? "border-primary bg-primary/5" : "border-border hover:border-accent/40"
                            }`}
                          >
                            <p className="text-xs font-medium">{format(parseISO(w.window_date), "EEE, MMM d")}</p>
                            <p className="text-xs text-muted-foreground capitalize">{w.window_slot}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Book Buttons */}
                {selectedWindow && (
                  <div className="space-y-2 pt-2">
                    {selectedSku.handle_cost > 0 && (
                      <Button
                        className="w-full"
                        disabled={booking || !canAfford(selectedSku)}
                        onClick={() => handleBook("handles")}
                      >
                        {booking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Use {selectedSku.handle_cost} Handles
                        {!canAfford(selectedSku) && (
                          <span className="ml-1 text-xs opacity-70">(need {selectedSku.handle_cost - (handleBalance ?? 0)} more)</span>
                        )}
                      </Button>
                    )}
                    {selectedSku.base_price_cents > 0 && (
                      <Button variant="outline" className="w-full" disabled={booking} onClick={() => handleBook("cash")}>
                        {booking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Pay ${(selectedSku.base_price_cents / 100).toFixed(2)}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
