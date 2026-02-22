import { useState } from "react";
import { useAdminSubscriptions, useAdminSubscriptionDetail, useAdminForceCancel, useAdminMarkComped } from "@/hooks/useAdminSubscriptions";
import { usePlanDetail } from "@/hooks/usePlans";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Subscription } from "@/hooks/useSubscription";

const STATUSES = ["all", "active", "trialing", "past_due", "canceled"];

export default function AdminSubscriptions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: subscriptions, isLoading } = useAdminSubscriptions({ status: statusFilter, search });
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <h1 className="text-h2">Subscriptions</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {STATUSES.map((s) => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {subscriptions?.map((sub) => (
            <SubscriptionRow key={sub.id} subscription={sub} onClick={() => setSelectedSubId(sub.id)} />
          ))}
          {(!subscriptions || subscriptions.length === 0) && (
            <p className="text-center text-muted-foreground py-8">No subscriptions found.</p>
          )}
        </div>
      )}

      <SubscriptionDetailSheet subscriptionId={selectedSubId} onClose={() => setSelectedSubId(null)} />
    </div>
  );
}

function SubscriptionRow({ subscription, onClick }: { subscription: Subscription; onClick: () => void }) {
  return (
    <Card className="press-feedback cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Customer: {subscription.customer_id.slice(0, 8)}…</p>
          <p className="text-xs text-muted-foreground">
            {subscription.current_period_end && `Renews ${format(new Date(subscription.current_period_end), "MMM d")}`}
          </p>
        </div>
        <StatusBadge status={subscription.status} />
      </CardContent>
    </Card>
  );
}

function SubscriptionDetailSheet({ subscriptionId, onClose }: { subscriptionId: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const { data, isLoading } = useAdminSubscriptionDetail(subscriptionId);
  const { data: plan } = usePlanDetail(data?.subscription.plan_id ?? null);
  const forceCancel = useAdminForceCancel();
  const markComped = useAdminMarkComped();
  const [reason, setReason] = useState("");

  return (
    <Sheet open={!!subscriptionId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Subscription Detail</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div className="space-y-3 py-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-32 w-full" /></div>
        ) : data ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{plan?.name ?? "—"}</p>
              <StatusBadge status={data.subscription.status} />
            </div>
            <div className="text-sm space-y-1">
              <p>Customer: {data.subscription.customer_id}</p>
              {data.subscription.stripe_subscription_id && <p>Stripe: {data.subscription.stripe_subscription_id}</p>}
              {data.subscription.current_period_end && (
                <p>Period end: {format(new Date(data.subscription.current_period_end), "MMM d, yyyy")}</p>
              )}
            </div>

            {/* Admin Actions */}
            <div className="space-y-2">
              <Textarea placeholder="Reason (required for admin actions)" value={reason} onChange={(e) => setReason(e.target.value)} />

              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!reason}>Mark Comped</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Mark as comped?</AlertDialogTitle><AlertDialogDescription>This will set the subscription to active without payment.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => {
                        await markComped.mutateAsync({ subscriptionId: data.subscription.id, reason, adminUserId: user!.id });
                        toast.success("Marked as comped");
                        setReason("");
                      }}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={!reason}>Force Cancel</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Force cancel?</AlertDialogTitle><AlertDialogDescription>This will immediately cancel the subscription.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => {
                        await forceCancel.mutateAsync({ subscriptionId: data.subscription.id, reason, adminUserId: user!.id });
                        toast.success("Subscription force-canceled");
                        setReason("");
                      }} className="bg-destructive text-destructive-foreground">Force Cancel</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Events Timeline */}
            {data.events.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Events</h3>
                {data.events.map((evt) => (
                  <div key={evt.id} className="text-xs border-l-2 border-border pl-3 py-1">
                    <p className="font-medium">{evt.event_type}</p>
                    <p className="text-muted-foreground">{evt.source} — {format(new Date(evt.created_at), "MMM d, HH:mm")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
