import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { RoleSwitcher } from "@/components/settings/RoleSwitcher";
import { PreviewAsCard } from "@/components/settings/PreviewAsCard";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Mail, ChevronLeft, FileText, Shield, Users, Send, X, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { HelpTip } from "@/components/ui/help-tip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      <HouseholdSection />

      {/* Moving */}
      <Link to="/customer/moving">
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors">
          <CardContent className="py-4 flex items-center gap-3">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">I'm moving</p>
              <p className="text-xs text-muted-foreground">Transfer your plan or pause services</p>
            </div>
          </CardContent>
        </Card>
      </Link>

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

function HouseholdSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const members = useQuery({
    queryKey: ["household-members"],
    queryFn: async () => {
      // Get properties owned by this user, then get all household members
      const { data: props } = await supabase
        .from("properties")
        .select("id")
        .eq("user_id", user!.id);
      if (!props || props.length === 0) return [];

      const propertyIds = props.map((p) => p.id);
      const { data, error } = await (supabase.from("household_members") as any)
        .select("*, profiles:user_id(full_name, phone)")
        .in("property_id", propertyIds)
        .neq("status", "removed")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleInvite = async () => {
    if (!inviteEmail) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setInviting(true);
    try {
      // Get user's property
      const { data: props } = await supabase
        .from("properties")
        .select("id")
        .eq("user_id", user!.id)
        .limit(1);
      if (!props || props.length === 0) {
        toast.error("No property found");
        return;
      }

      const { error } = await (supabase.from("household_members") as any).insert({
        property_id: props[0].id,
        invite_email: inviteEmail,
        invited_by: user!.id,
        role: "member",
        status: "pending",
      });
      if (error) throw error;
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      toast.success(`Invite sent to ${inviteEmail}`);
    } catch (err: any) {
      if (err?.code === "23505") {
        toast.error("This person is already invited");
      } else {
        toast.error("Failed to send invite");
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!window.confirm("Remove this household member?")) return;
    const { error } = await (supabase.from("household_members") as any)
      .update({ status: "removed" })
      .eq("id", memberId);
    if (error) {
      toast.error("Failed to remove member");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["household-members"] });
    toast.success("Member removed");
  };

  const memberList = (members.data ?? []) as any[];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Household
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Add household members so they can view your service schedule and history.
        </p>

        {/* Member list */}
        {members.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
        {members.isError && (
          <p className="text-xs text-destructive">Failed to load household members.</p>
        )}
        {!members.isLoading && !members.isError && memberList.length === 0 && (
          <p className="text-xs text-muted-foreground">No household members yet. Invite someone below.</p>
        )}
        {!members.isLoading && !members.isError && memberList.length > 0 && (
          <div className="space-y-2">
            {memberList.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {m.profiles?.full_name || m.invite_email || "Unknown"}
                  </span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {m.status === "pending" ? "pending" : m.role}
                  </Badge>
                </div>
                {m.role !== "owner" && m.user_id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(m.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Invite form */}
        <div className="flex gap-2">
          <Input
            placeholder="Email address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="h-9"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
          <Button size="sm" onClick={handleInvite} disabled={!inviteEmail || inviting} className="h-9">
            <Send className="h-3.5 w-3.5 mr-1" />
            Invite
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
