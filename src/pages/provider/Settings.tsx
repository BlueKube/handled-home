import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { RoleSwitcher } from "@/components/settings/RoleSwitcher";
import { PreviewAsCard } from "@/components/settings/PreviewAsCard";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Mail } from "lucide-react";

export default function ProviderSettings() {
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
    <div className="animate-fade-in p-4 pb-24 space-y-6">
      <h1 className="text-h2">Account Settings</h1>

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
    </div>
  );
}
