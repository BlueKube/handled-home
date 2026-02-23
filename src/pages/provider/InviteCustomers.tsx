import { useNavigate } from "react-router-dom";
import { Copy, Link, ArrowLeft, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useReferralCodes } from "@/hooks/useReferralCodes";
import { useInviteScripts } from "@/hooks/useInviteScripts";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useGrowthEvents } from "@/hooks/useGrowthEvents";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";


export default function InviteCustomers() {
  const navigate = useNavigate();
  const { codes, generateCode } = useReferralCodes();
  const { scripts } = useInviteScripts();
  const { org } = useProviderOrg();
  const { recordEvent } = useGrowthEvents();
  const { user } = useAuth();

  const inviteLink = codes.data?.[0]?.code
    ? `${window.location.origin}/invite/${codes.data[0].code}`
    : null;
  const providerName = org?.name ?? "Your Pro";

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied!");
      recordEvent.mutate({
        eventType: "link_copied",
        actorRole: "provider",
        sourceSurface: "provider_milestone_share",
        idempotencyKey: `prov_copy_${user?.id}_${Date.now()}`,
      });
    }
  };

  const copyScript = (body: string) => {
    const text = body
      .replace("{provider_name}", providerName)
      .replace("{link}", inviteLink ?? "");
    navigator.clipboard.writeText(text);
    toast.success("Script copied!");
    recordEvent.mutate({
      eventType: "script_copied",
      actorRole: "provider",
      sourceSurface: "provider_milestone_share",
      idempotencyKey: `prov_script_${user?.id}_${Date.now()}`,
    });
  };

  if (codes.isLoading) return <div className="p-4"><Skeleton className="h-48" /></div>;

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Invite Customers</h1>
      </div>

      {/* Copy Link */}
      {inviteLink ? (
        <div className="space-y-3">
          <Button onClick={copyLink} className="w-full gap-2" size="lg">
            <Copy className="h-4 w-4" /> Copy Invite Link
          </Button>
          <p className="text-xs text-muted-foreground text-center break-all">{inviteLink}</p>
        </div>
      ) : (
        <Button
          onClick={async () => {
            let programId = codes.data?.[0]?.program_id;
            if (!programId) {
              const { data: programs } = await (supabase as any)
                .from("referral_programs")
                .select("id")
                .eq("status", "active")
                .limit(1);
              programId = programs?.[0]?.id;
            }
            if (programId) {
              generateCode.mutate(programId);
            } else {
              toast.error("No active referral program found.");
            }
          }}
          variant="outline"
          className="w-full gap-2"
          disabled={generateCode.isPending}
        >
          <Link className="h-4 w-4" /> Generate Invite Link
        </Button>
      )}

      {/* QR Code - Coming soon */}
      {inviteLink && (
        <Card>
          <CardContent className="py-4 flex items-center gap-3 text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            <p className="text-xs">QR code generation coming soon. Use the copy link above for now.</p>
          </CardContent>
        </Card>
      )}

      {/* SMS Scripts */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">SMS Scripts</h2>
        <p className="text-sm text-muted-foreground">Tap any script to copy it with your link included.</p>

        {scripts.data && scripts.data.length > 0 ? (
          scripts.data.map((s: any) => (
            <Card key={s.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => copyScript(s.body)}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs capitalize">{s.tone}</Badge>
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.body.replace("{provider_name}", providerName).replace("{link}", inviteLink ?? "[link]")}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No scripts available yet. Your invite link above works great on its own!</p>
        )}
      </div>
    </div>
  );
}
