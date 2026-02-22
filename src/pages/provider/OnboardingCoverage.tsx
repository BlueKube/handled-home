import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderCoverage } from "@/hooks/useProviderCoverage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingCoverage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { org, loading: orgLoading } = useProviderOrg();

  // P1: Fall back to useProviderOrg when location.state is lost
  const orgId = location.state?.orgId || org?.id;
  const stateZoneIds = location.state?.allowedZoneIds;

  const { coverage, addCoverage, removeCoverage, loading } = useProviderCoverage(orgId);
  const [saving, setSaving] = useState(false);

  // P3/P7: If allowedZoneIds not in state, query from invite
  const { data: allowedZoneIds } = useQuery({
    queryKey: ["invite_zone_ids", org?.invite_id],
    queryFn: async () => {
      if (stateZoneIds) return stateZoneIds;
      if (!org?.invite_id) return [];
      const { data, error } = await supabase
        .from("provider_invites")
        .select("allowed_zone_ids")
        .eq("id", org.invite_id)
        .single();
      if (error) return [];
      return data?.allowed_zone_ids ?? [];
    },
    enabled: !!orgId,
    initialData: stateZoneIds,
  });

  // Fetch available zones
  const { data: zones } = useQuery({
    queryKey: ["zones_for_coverage", allowedZoneIds],
    queryFn: async () => {
      let q = supabase.from("zones").select("id, name, zip_codes, status").eq("status", "active");
      if (allowedZoneIds && allowedZoneIds.length > 0) {
        q = q.in("id", allowedZoneIds);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!allowedZoneIds,
  });

  const selectedZoneIds = coverage.map((c: any) => c.zone_id);

  const toggleZone = async (zoneId: string) => {
    setSaving(true);
    try {
      const existing = coverage.find((c: any) => c.zone_id === zoneId);
      if (existing) {
        await removeCoverage.mutateAsync(existing.id);
      } else {
        await addCoverage.mutateAsync({ orgId, zoneId });
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (orgLoading) {
    return <div className="p-4 flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <p className="text-caption mb-1">Step 2 of 5</p>
      <h1 className="text-h2 mb-1">Coverage Zones</h1>
      <p className="text-caption mb-6">Select the zones you'd like to serve. Your requests will be reviewed by our team.</p>

      <div className="space-y-3 mb-6">
        {zones?.map((zone) => {
          const selected = selectedZoneIds.includes(zone.id);
          return (
            <Card key={zone.id} className={`press-feedback cursor-pointer ${selected ? "ring-2 ring-accent" : ""}`} onClick={() => toggleZone(zone.id)}>
              <CardContent className="py-4 flex items-center gap-3">
                <Checkbox checked={selected} className="pointer-events-none" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{zone.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ZIP: {zone.zip_codes?.slice(0, 3).join(", ")}{zone.zip_codes?.length > 3 ? ` +${zone.zip_codes.length - 3} more` : ""}
                  </p>
                </div>
                {selected && <Badge variant="secondary">Requested</Badge>}
              </CardContent>
            </Card>
          );
        })}
        {zones?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No zones available for your invite code.</p>
        )}
      </div>

      <Button
        className="w-full"
        disabled={selectedZoneIds.length === 0 || saving}
        onClick={() => navigate("/provider/onboarding/capabilities", { state: { orgId, allowedZoneIds } })}
      >
        Continue
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
