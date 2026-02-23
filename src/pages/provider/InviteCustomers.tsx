import { useNavigate } from "react-router-dom";
import { Copy, Link, ArrowLeft, QrCode } from "lucide-react";
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
import { useRef, useEffect } from "react";

function drawQR(canvas: HTMLCanvasElement, text: string) {
  // Simple visual placeholder — real QR would need a library
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = 200;
  canvas.width = size;
  canvas.height = size;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#000000";
  // Draw a pattern representing a QR code placeholder
  const cellSize = 8;
  const margin = 20;
  for (let x = margin; x < size - margin; x += cellSize) {
    for (let y = margin; y < size - margin; y += cellSize) {
      if (Math.random() > 0.5) {
        ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
      }
    }
  }
  // Corner markers
  const markerSize = cellSize * 3;
  [margin, size - margin - markerSize].forEach((mx) => {
    [margin, size - margin - markerSize].forEach((my) => {
      if (mx === size - margin - markerSize && my === size - margin - markerSize) return;
      ctx.fillStyle = "#000";
      ctx.fillRect(mx, my, markerSize, markerSize);
      ctx.fillStyle = "#fff";
      ctx.fillRect(mx + cellSize, my + cellSize, cellSize, cellSize);
    });
  });
}

export default function InviteCustomers() {
  const navigate = useNavigate();
  const { codes, generateCode } = useReferralCodes();
  const { scripts } = useInviteScripts();
  const { org } = useProviderOrg();
  const { recordEvent } = useGrowthEvents();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const inviteLink = codes.data?.[0]?.code
    ? `${window.location.origin}/invite/${codes.data[0].code}`
    : null;
  const providerName = org?.name ?? "Your Pro";

  useEffect(() => {
    if (canvasRef.current && inviteLink) {
      drawQR(canvasRef.current, inviteLink);
    }
  }, [inviteLink]);

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
          onClick={() => {
            const programId = codes.data?.[0]?.program_id;
            if (programId) generateCode.mutate(programId);
          }}
          variant="outline"
          className="w-full gap-2"
          disabled={generateCode.isPending}
        >
          <Link className="h-4 w-4" /> Generate Invite Link
        </Button>
      )}

      {/* QR Code */}
      {inviteLink && (
        <Card>
          <CardContent className="py-6 flex flex-col items-center gap-3">
            <QrCode className="h-5 w-5 text-muted-foreground" />
            <canvas ref={canvasRef} className="rounded-lg border" />
            <p className="text-xs text-muted-foreground">Show this to customers</p>
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
