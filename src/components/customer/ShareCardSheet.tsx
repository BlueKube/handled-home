import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Ban, Loader2, ImageIcon } from "lucide-react";
import { useShareCard } from "@/hooks/useShareCard";
import { useGrowthEvents } from "@/hooks/useGrowthEvents";
import { toast } from "sonner";

interface ShareCardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  zoneId?: string;
  category?: string;
}

export function ShareCardSheet({ open, onOpenChange, jobId, zoneId, category }: ShareCardSheetProps) {
  const { card, createCard, revokeCard, updateCard } = useShareCard(jobId);
  const { recordEvent } = useGrowthEvents();
  const [creating, setCreating] = useState(false);

  // Create share card on open if none exists
  useEffect(() => {
    if (open && !card.data && !card.isLoading && !creating) {
      setCreating(true);
      createCard.mutate(jobId, {
        onSettled: () => setCreating(false),
        onError: (e: any) => toast.error(e.message),
      });
    }
  }, [open, card.data, card.isLoading]);

  const shareData = card.data;
  const shareUrl = shareData?.share_code
    ? `${window.location.origin}/share/${shareData.share_code}`
    : null;

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied!");
    recordEvent.mutate({
      eventType: "link_copied",
      actorRole: "customer",
      sourceSurface: "receipt_share_card",
      idempotencyKey: `copy_${shareData.share_code}_${Date.now()}`,
      zoneId,
      category,
      context: { share_code: shareData.share_code },
    });
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    recordEvent.mutate({
      eventType: "share_initiated",
      actorRole: "customer",
      sourceSurface: "receipt_share_card",
      idempotencyKey: `share_${shareData.share_code}_${Date.now()}`,
      zoneId,
      category,
      context: { share_code: shareData.share_code },
    });

    try {
      await navigator.share({
        title: "Check out my yard — Handled Home",
        url: shareUrl,
      });
      recordEvent.mutate({
        eventType: "share_completed",
        actorRole: "customer",
        sourceSurface: "receipt_share_card",
        idempotencyKey: `shared_${shareData.share_code}_${Date.now()}`,
        zoneId,
        category,
      });
    } catch {
      // User cancelled share
    }
  };

  const handleRevoke = () => {
    if (!shareData?.id) return;
    revokeCard.mutate(shareData.id, {
      onSuccess: () => {
        toast.success("Share link disabled");
        onOpenChange(false);
      },
      onError: (e: any) => toast.error(e.message),
    });
  };

  const isLoading = card.isLoading || creating || createCard.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Share your results</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : shareData ? (
          <div className="space-y-5 pt-4">
            {/* Hero preview */}
            <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3] flex items-center justify-center">
              {shareData.hero_photo_path ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                  <p className="absolute bottom-2 left-3 text-xs text-muted-foreground">Photo preview</p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mx-auto mb-1 opacity-40" />
                  <p className="text-xs">No photo available</p>
                </div>
              )}
              {/* Handled stamp */}
              <div className="absolute bottom-3 right-3 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                Handled.
              </div>
            </div>

            {/* Checklist bullets */}
            {shareData.checklist_bullets && (shareData.checklist_bullets as any[]).length > 0 && (
              <div className="space-y-1">
                {(shareData.checklist_bullets as string[]).map((b: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-accent">✓</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Privacy toggles */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-name" className="text-sm">Show my first name</Label>
                <Switch
                  id="show-name"
                  checked={shareData.show_first_name}
                  onCheckedChange={(v) => updateCard.mutate({ id: shareData.id, show_first_name: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-hood" className="text-sm">Show neighborhood</Label>
                <Switch
                  id="show-hood"
                  checked={shareData.show_neighborhood}
                  onCheckedChange={(v) => updateCard.mutate({ id: shareData.id, show_neighborhood: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="before-after" className="text-sm">Before & after mode</Label>
                <Switch
                  id="before-after"
                  checked={shareData.asset_mode === "before_after"}
                  onCheckedChange={(v) => updateCard.mutate({ id: shareData.id, asset_mode: v ? "before_after" : "after_only" })}
                />
              </div>
            </div>

            {/* Share actions */}
            <div className="space-y-2">
              <Button onClick={handleCopyLink} className="w-full gap-2" size="lg">
                <Copy className="h-4 w-4" /> Copy Link
              </Button>

              {"share" in navigator && (
                <Button onClick={handleNativeShare} variant="outline" className="w-full gap-2" size="lg">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              )}
            </div>

            {/* Revoke */}
            <div className="border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive gap-1 w-full"
                onClick={handleRevoke}
                disabled={revokeCard.isPending}
              >
                <Ban className="h-3.5 w-3.5" /> Disable shared link
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Unable to create share card. The visit may have an open dispute.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
