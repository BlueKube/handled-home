import { useNavigate, useLocation } from "react-router-dom";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderCapabilities } from "@/hooks/useProviderCapabilities";
import { useSkus } from "@/hooks/useSkus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Camera, ListChecks, Clock, Loader2 } from "lucide-react";

export default function OnboardingCapabilities() {
  const navigate = useNavigate();
  const location = useLocation();
  const { org, loading: orgLoading } = useProviderOrg();

  // P1: Fall back to useProviderOrg
  const orgId = location.state?.orgId || org?.id;
  const allowedZoneIds = location.state?.allowedZoneIds || [];

  const { capabilities, toggleCapability } = useProviderCapabilities(orgId);
  const skusQuery = useSkus();

  const activeSkus = (skusQuery.data ?? []).filter((s) => s.status === "active");
  const categories = Array.from(new Set(activeSkus.map((s) => s.category || "General")));

  const isEnabled = (skuId: string) => capabilities.some((c: any) => c.sku_id === skuId && c.is_enabled);
  const enabledCount = capabilities.filter((c: any) => c.is_enabled).length;

  const handleToggle = (sku: any) => {
    toggleCapability.mutate({
      orgId,
      skuId: sku.id,
      skuName: sku.name,
      category: sku.category || "General",
      enabled: !isEnabled(sku.id),
    });
  };

  if (orgLoading) {
    return <div className="p-4 flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <p className="text-caption mb-1">Step 3 of 5</p>
      <h1 className="text-h2 mb-1">Your Capabilities</h1>
      <p className="text-caption mb-6">Select the services you can reliably perform. We'll match you with the right jobs.</p>

      {categories.map((cat) => (
        <Card key={cat} className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeSkus.filter((s: any) => (s.category || "General") === cat).map((sku: any) => (
              <div key={sku.id} className="flex items-start gap-3 py-2">
                <Switch checked={isEnabled(sku.id)} onCheckedChange={() => handleToggle(sku)} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{sku.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />{sku.duration_minutes}min
                    </Badge>
                    {sku.required_photos?.length > 0 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Camera className="h-3 w-3" />{sku.required_photos.length} photos
                      </Badge>
                    )}
                    {sku.checklist?.length > 0 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <ListChecks className="h-3 w-3" />{sku.checklist.length} checks
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button
        className="w-full"
        disabled={enabledCount === 0}
        onClick={() => navigate("/provider/onboarding/compliance", { state: { orgId, allowedZoneIds } })}
      >
        Continue ({enabledCount} selected)
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
