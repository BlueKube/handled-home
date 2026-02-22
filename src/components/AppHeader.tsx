import { useAuth, AppRole } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const { user, roles, activeRole, setActiveRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = (role: string) => {
    setActiveRole(role as AppRole);
    navigate(`/${role}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4">
      <SidebarTrigger className="text-foreground" />
      <h2 className="text-lg font-bold text-foreground">Handled Home</h2>

      <div className="ml-auto flex items-center gap-3">
        {roles.length > 1 && (
          <Select value={activeRole} onValueChange={handleRoleSwitch}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
