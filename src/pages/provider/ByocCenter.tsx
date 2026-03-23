import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useByocInviteLinks } from "@/hooks/useByocInviteLinks";
import { useInviteScripts } from "@/hooks/useInviteScripts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Plus, Copy, Link2, Users, Gift, ChevronDown, CheckCircle, XCircle, AlertTriangle, Info, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
      <div className="animate-fade-in p-4 pb-24 text-center mt-12">
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
    <div className="animate-fade-in p-4 pb-24 space-y-4">
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

      {/* How BYOC Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            How BYOC Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex gap-2"><span className="font-semibold text-foreground">1.</span> Create an invite link for your service category and zone.</div>
          <div className="flex gap-2"><span className="font-semibold text-foreground">2.</span> Share the link with your existing customers via text or email.</div>
          <div className="flex gap-2"><span className="font-semibold text-foreground">3.</span> When they sign up, you earn BYOC bonuses and keep servicing them.</div>
        </CardContent>
      </Card>

      {/* Compliance Reminder */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Do not promise permanent pricing. Transition credits may apply. All pricing is set by Handled Home.
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Active Links" value={activeLinks.length} icon={<Link2 className="h-4 w-4" />} />
        <StatCard label="Activations" value={totalActivations} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Recent Events" value={recentEvents.length} icon={<Gift className="h-4 w-4" />} />
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

      {/* Recent Events */}
      {recentEvents.length > 0 && (
        <Collapsible>
          <Card>
            <CardHeader>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Recent Activity ({recentEvents.length})
                </CardTitle>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-2 pt-0">
                {recentEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <Badge variant="outline" className="text-xs mr-2">{event.event_type}</Badge>
                      <span className="text-muted-foreground">{event.actor}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(event.created_at), "MMM d, h:mm a")}</span>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

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

      {/* Customer Referral Cross-Sell */}
      <Card className="border-muted bg-muted/30">
        <CardContent className="py-4 px-4">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <p className="text-sm font-medium">Your customers can refer their neighbors too</p>
              <p className="text-xs text-muted-foreground">
                Activated customers get a referral code — more neighbors means denser routes and better earnings for you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
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
            <CheckCircle className="h-3 w-3 text-green-500" />
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
