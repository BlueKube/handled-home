import { useZoneProviders, useProvidersList, useToggleProviderAssignment } from "@/hooks/useZoneProviders";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle } from "lucide-react";

interface ZoneProvidersPanelProps {
  zoneId: string;
}

export function ZoneProvidersPanel({ zoneId }: ZoneProvidersPanelProps) {
  const { data: assignments, isLoading: assignLoading } = useZoneProviders(zoneId);
  const { data: providers, isLoading: provLoading } = useProvidersList();
  const toggle = useToggleProviderAssignment();

  const isLoading = assignLoading || provLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!providers?.length) {
    return <p className="text-muted-foreground text-center py-8">No providers found. Add provider roles first.</p>;
  }

  const hasPrimary = assignments?.some((a) => a.assignment_type === "primary");

  const isAssigned = (userId: string, type: string) =>
    assignments?.some((a) => a.provider_user_id === userId && a.assignment_type === type) || false;

  const isBothAssigned = (userId: string) => isAssigned(userId, "primary") && isAssigned(userId, "backup");

  return (
    <div className="space-y-4">
      {!hasPrimary && (
        <div className="flex items-center gap-2 text-warning text-sm bg-warning/10 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>No primary provider assigned. At least one is recommended.</span>
        </div>
      )}

      <div className="space-y-2">
        {providers.map((p) => (
          <div key={p.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <Avatar className="h-8 w-8">
              <AvatarImage src={p.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{p.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.full_name}</p>
              {isBothAssigned(p.user_id) && (
                <p className="text-caption text-warning">Both primary & backup</p>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={isAssigned(p.user_id, "primary")}
                  onCheckedChange={(checked) =>
                    toggle.mutate({ zoneId, providerUserId: p.user_id, assignmentType: "primary", enabled: checked })
                  }
                />
                <Label className="text-xs text-muted-foreground">Pri</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={isAssigned(p.user_id, "backup")}
                  onCheckedChange={(checked) =>
                    toggle.mutate({ zoneId, providerUserId: p.user_id, assignmentType: "backup", enabled: checked })
                  }
                />
                <Label className="text-xs text-muted-foreground">Bak</Label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
