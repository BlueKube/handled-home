import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { RoleSwitcher } from "@/components/settings/RoleSwitcher";
import { PreviewAsCard } from "@/components/settings/PreviewAsCard";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Mail, ChevronLeft, FileText, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { HelpTip } from "@/components/ui/help-tip";

export default function CustomerSettings() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <button onClick={() => navigate("/customer/more")} className="flex items-center gap-1 text-muted-foreground mb-2 hover:text-foreground transition-colors" aria-label="Back to More menu">
        <ChevronLeft className="h-4 w-4" />
        <span className="text-sm">More</span>
      </button>
      <h1 className="text-h2">Account Settings <HelpTip text="Update your profile, notification preferences, and security settings here." /></h1>

      {/* Avatar + email */}
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

      {/* Legal */}
      <div className="flex gap-3">
        <Link to="/privacy" className="flex-1">
          <Button variant="outline" size="sm" className="w-full text-xs">
            <Shield className="h-3 w-3 mr-1" /> Privacy Policy
          </Button>
        </Link>
        <Link to="/terms" className="flex-1">
          <Button variant="outline" size="sm" className="w-full text-xs">
            <FileText className="h-3 w-3 mr-1" /> Terms of Service
          </Button>
        </Link>
      </div>

      <DeleteAccountSection />

      <Button variant="ghost" onClick={handleSignOut} className="w-full flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/5">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
