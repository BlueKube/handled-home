import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderCoverage } from "@/hooks/useProviderCoverage";
import { useProviderCapabilities } from "@/hooks/useProviderCapabilities";
import { toast } from "sonner";
import {
  MapPin,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
} from "lucide-react";

function CoverageZones() {
  const { org } = useProviderOrg();
  const { coverage, loading } = useProviderCoverage(org?.id);

  if (loading) return <Skeleton className="h-32 rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Coverage Zones
          </CardTitle>
          <Badge variant="outline" className="text-xs">{coverage.length} zone{coverage.length !== 1 ? "s" : ""}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {coverage.length === 0 ? (
          <div className="text-center py-6">
            <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No coverage zones assigned</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Coverage zones are assigned during onboarding</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coverage.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.zones?.name ?? "Zone"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs capitalize">
                      {(c.coverage_type ?? "primary").toLowerCase()}
                    </Badge>
                    <Badge
                      variant={c.request_status === "APPROVED" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {c.request_status}
                    </Badge>
                  </div>
                </div>
                {c.max_travel_miles && (
                  <span className="text-xs text-muted-foreground">{c.max_travel_miles} mi</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SkuCapabilities() {
  const { org } = useProviderOrg();
  const { capabilities, loading, toggleCapability } = useProviderCapabilities(org?.id);

  if (loading) return <Skeleton className="h-48 rounded-xl" />;

  // Group by category
  const grouped: Record<string, typeof capabilities> = {};
  capabilities.forEach((cap: any) => {
    const cat = cap.service_skus?.category ?? cap.capability_key ?? "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(cap);
  });

  const categories = Object.keys(grouped).sort();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Service Capabilities
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {capabilities.filter((c: any) => c.is_enabled).length}/{capabilities.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {capabilities.length === 0 ? (
          <div className="text-center py-6">
            <Wrench className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No service capabilities configured</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Capabilities are set up during onboarding</p>
          </div>
        ) : (
          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {cat}
                </h3>
                <div className="space-y-2">
                  {grouped[cat].map((cap: any) => {
                    const sku = cap.service_skus;
                    return (
                      <div
                        key={cap.id}
                        className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                      >
                        <Switch
                          checked={cap.is_enabled}
                          onCheckedChange={(checked) => {
                            if (!org) return;
                            toggleCapability.mutate(
                              {
                                orgId: org.id,
                                skuId: cap.sku_id ?? "",
                                skuName: sku?.name ?? "",
                                category: cat,
                                enabled: checked,
                              },
                              {
                                onSuccess: () =>
                                  toast.success(
                                    `${sku?.name ?? "Service"} ${checked ? "enabled" : "disabled"}`
                                  ),
                                onError: () => toast.error("Failed to update capability"),
                              }
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{sku?.name ?? cap.capability_key}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {sku?.duration_minutes && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {sku.duration_minutes} min
                              </span>
                            )}
                            {sku?.required_photos != null && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                {sku.required_photos} photos
                              </span>
                            )}
                          </div>
                        </div>
                        {cap.is_enabled ? (
                          <CheckCircle className="h-4 w-4 text-success shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProviderCoverage() {
  const { loading } = useProviderOrg();

  if (loading) {
    return (
      <div className="animate-fade-in p-4 pb-24 space-y-4 max-w-2xl">
        <h1 className="text-h2">Coverage & Capacity</h1>
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4 max-w-2xl">
      <div>
        <h1 className="text-h2">Coverage & Capacity</h1>
        <p className="text-caption mt-0.5">Your zones and service capabilities</p>
      </div>
      <CoverageZones />
      <SkuCapabilities />
    </div>
  );
}
