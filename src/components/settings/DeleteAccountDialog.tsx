import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmation !== "DELETE") return;
    setDeleting(true);
    try {
      // Call the account deletion RPC which anonymizes user data
      const { error } = await (supabase.rpc as any)("delete_user_account", {
        p_user_id: user?.id,
      });
      if (error) throw error;

      await signOut();
      navigate("/auth");
      toast.success("Your account has been deleted.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account. Please contact support.");
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="p-4 border-destructive/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-semibold">Delete Account</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Permanently delete your account and all associated data. Your subscription will be cancelled,
            and your personal information will be anonymized within 30 days. This action cannot be undone.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => setOpen(true)}
          >
            Delete My Account
          </Button>
        </div>
      </Card>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Your Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This will permanently:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Cancel your active subscription</li>
                <li>Remove your property and service history</li>
                <li>Anonymize your personal information</li>
                <li>Revoke all referral rewards</li>
              </ul>
              <p className="font-medium text-foreground">
                This action cannot be undone. Type <span className="font-mono text-destructive">DELETE</span> to confirm.
              </p>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="font-mono"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={confirmation !== "DELETE" || deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Permanently Delete Account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
