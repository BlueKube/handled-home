import { useSkus } from "@/hooks/useSkus";
import { useZones } from "@/hooks/useZones";
import { useAdminMembership } from "@/hooks/useAdminMembership";
import { usePayoutBase } from "@/hooks/useProviderPayoutAdmin";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, Clock, FileText } from "lucide-react";
import { PayoutsTab, ContractsTab, OvertimeTab } from "@/components/admin/payouts";

export default function ControlPayouts() {
  const { isSuperuser } = useAdminMembership();
  const { data: skus, isLoading: skusLoading } = useSkus();
  const { data: zones, isLoading: zonesLoading } = useZones();
  const { isLoading: baseLoading } = usePayoutBase();

  if (skusLoading || zonesLoading || baseLoading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">Provider Payout Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">Payout tables, contract types, overtime params. Superuser-only writes.</p>
        </div>
        {!isSuperuser && <Badge variant="secondary">Read-only</Badge>}
      </div>

      <Tabs defaultValue="payouts">
        <TabsList>
          <TabsTrigger value="payouts"><Banknote className="h-3.5 w-3.5 mr-1" />Payouts</TabsTrigger>
          <TabsTrigger value="contracts"><FileText className="h-3.5 w-3.5 mr-1" />Contracts</TabsTrigger>
          <TabsTrigger value="overtime"><Clock className="h-3.5 w-3.5 mr-1" />Overtime</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts">
          <PayoutsTab skus={skus ?? []} zones={zones ?? []} isSuperuser={isSuperuser} />
        </TabsContent>

        <TabsContent value="contracts">
          <ContractsTab isSuperuser={isSuperuser} />
        </TabsContent>

        <TabsContent value="overtime">
          <OvertimeTab skus={skus ?? []} zones={zones ?? []} isSuperuser={isSuperuser} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
