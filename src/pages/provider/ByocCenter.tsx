import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useByocInviteLinks } from "@/hooks/useByocInviteLinks";
import { useInviteScripts } from "@/hooks/useInviteScripts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Copy, Link2, Users, Gift, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function ByocCenter() {
  const navigate = useNavigate();
  const { org, loading: orgLoading } = useProviderOrg();
  const { links, deactivateLink, events } = useByocInviteLinks();
  const { scripts } = useInviteScripts();

  if (orgLoading || links.isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Gate: must be approved provider org
  if (!org || (org.status !== "ACTIVE" && org.status !== "PROBATION")) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center mt-12 animate-fade-in">
        <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-h2 mb-2">BYOC Center</h1>
        <p className="text-caption">
          You need an approved provider account to access the BYOC Center.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/provider")}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const activeLinks = links.data?.filter((l) => l.is_active) ?? [];
  const inactiveLinks = links.data?.filter((l) => !l.is_active) ?? [];
  const totalActivations = links.data?.reduce(
    (sum, l) => sum + ((l as any).byoc_activations?.[0]?.count ?? 0),
    0
  ) ?? 0;
  const recentEvents = events.data?.slice(0, 10) ?? [];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">BYOC Center</h1>
          <p className="text-caption">Bring Your Own Customers</p>
        </div>
        <Button size="sm" onClick={() => navigate("/provider/byoc/create-link")}>
          <Plus className="h-4 w-4 mr-1" />
          New Link
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Active Links" value={activeLinks.length} icon={<Link2 className="h-4 w-4" />} />
        <StatCard label="Activations" value={totalActivations} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Events" value={recentEvents.length} icon={<Gift className="h-4 w-4" />} />
      </div>

      {/* Invite Scripts */}
      {scripts.data && scripts.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite Scripts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scripts.data.slice(0, 3).map((script) => (
              <ScriptCard key={script.id} script={script} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Active Invite Links ({activeLinks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active links yet. Create one to start inviting customers.
            </p>
          ) : (
            activeLinks.map((link) => (
              <InviteLinkCard
                key={link.id}
                link={link}
                onDeactivate={() => {
                  deactivateLink.mutate(link.id, {
                    onSuccess: () => toast.success("Link deactivated"),
                  });
                }}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Inactive Links */}
      {inactiveLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">
              Inactive Links ({inactiveLinks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inactiveLinks.map((link) => (
              <InviteLinkCard key={link.id} link={link} inactive />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-3 text-center">
        <div className="flex items-center justify-center text-muted-foreground mb-1">{icon}</div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ScriptCard({ script }: { script: any }) {
  const copyScript = () => {
    navigator.clipboard.writeText(script.body);
    toast.success("Script copied to clipboard");
  };

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs capitalize">{script.tone}</Badge>
        <Button variant="ghost" size="sm" onClick={copyScript}>
          <Copy className="h-3 w-3 mr-1" />
          Copy
        </Button>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{script.body}</p>
    </div>
  );
}

function InviteLinkCard({
  link,
  onDeactivate,
  inactive,
}: {
  link: any;
  onDeactivate?: () => void;
  inactive?: boolean;
}) {
  const activations = (link as any).byoc_activations?.[0]?.count ?? 0;
  const shareUrl = `${window.location.origin}/byoc/activate/${link.token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Invite link copied");
  };

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${inactive ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={inactive ? "secondary" : "default"} className="text-xs">
            {link.category_key.replace(/_/g, " ")}
          </Badge>
          {inactive ? (
            <XCircle className="h-3 w-3 text-muted-foreground" />
          ) : (
            <CheckCircle className="h-3 w-3 text-success" />
          )}
        </div>
        <span className="text-xs text-muted-foreground font-mono">{link.token}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{activations} activation{activations !== 1 ? "s" : ""}</span>
        <span>{link.default_cadence}</span>
      </div>

      {!inactive && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={copyLink}>
            <Copy className="h-3 w-3 mr-1" />
            Copy Link
          </Button>
          {onDeactivate && (
            <Button variant="ghost" size="sm" onClick={onDeactivate}>
              Deactivate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
