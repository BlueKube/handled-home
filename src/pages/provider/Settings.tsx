import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { RoleSwitcher } from "@/components/settings/RoleSwitcher";
import { PreviewAsCard } from "@/components/settings/PreviewAsCard";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { ProviderStatusBanner } from "@/components/provider/ProviderStatusBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Mail, UserX, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ProviderSettings() {
  const { user, profile, signOut } = useAuth();
  const { org } = useProviderOrg();
  const navigate = useNavigate();
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const orgStatus = org?.status ?? "ACTIVE";

  const initials = (profile?.full_name ?? user?.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleExitRequest = async () => {
    setSubmitting(true);
    try {
      // Stub: In production this calls request_provider_exit RPC
      // which triggers 14-day notice, job reassignment, and customer notification
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Exit request submitted. You'll receive confirmation via email within 24 hours.");
      setExitDialogOpen(false);
      setConfirmText("");
    } catch {
      toast.error("Failed to submit exit request. Please try again or contact support.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-6">
      <h1 className="text-h2">Account Settings</h1>

      <ProviderStatusBanner status={orgStatus} />

      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 text-lg">
          <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Mail className="h-4 w-4" />
          <span>{user?.email}</span>
        </div>
      </div>

      <ProfileForm />
      <ChangePasswordForm />
      <NotificationPreferences />
      <RoleSwitcher />
      <PreviewAsCard />

      <Button variant="destructive" onClick={handleSignOut} className="w-full flex items-center gap-2">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>

      {/* Account deactivation */}
      <Card className="border-destructive/20">
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-destructive" />
            <h2 className="text-sm font-semibold">Deactivate Account</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Request to deactivate your provider account. A 14-day notice period applies — your scheduled jobs will be reassigned to other providers in your coverage zones, and affected customers will be notified.
          </p>
          <p className="text-xs text-muted-foreground">
            Any pending earnings will be paid out on the next regular payout cycle.
          </p>
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => setExitDialogOpen(true)}
          >
            Request Deactivation
          </Button>
        </CardContent>
      </Card>

      {/* Exit confirmation dialog */}
      <Dialog open={exitDialogOpen} onOpenChange={(v) => { if (!v) { setExitDialogOpen(false); setConfirmText(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Account Deactivation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">This will:</p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Begin a 14-day notice period</li>
                <li>• Reassign all your scheduled jobs to other providers</li>
                <li>• Notify your assigned customers of the provider change</li>
                <li>• Pay out any pending earnings on the next cycle</li>
              </ul>
            </div>
            <div>
              <Label htmlFor="confirm-exit" className="text-sm">
                Type <span className="font-semibold">DEACTIVATE</span> to confirm
              </Label>
              <Input
                id="confirm-exit"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DEACTIVATE"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setExitDialogOpen(false); setConfirmText(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== "DEACTIVATE" || submitting}
              onClick={handleExitRequest}
            >
              {submitting ? "Submitting…" : "Confirm Deactivation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
