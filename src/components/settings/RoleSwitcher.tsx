import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Repeat } from "lucide-react";

export function RoleSwitcher() {
  const { roles, activeRole, setActiveRole, effectiveRole, previewRole, setPreviewRole } = useAuth();
  const navigate = useNavigate();

  // Show if user has multiple roles OR if admin is previewing
  if (roles.length <= 1 && !previewRole) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Repeat className="h-5 w-5 text-muted-foreground" />
          Switch Role
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => {
                if (activeRole === "admin" && previewRole) {
                  // If previewing, switch preview role
                  if (r === "admin") {
                    setPreviewRole(null);
                  } else {
                    setPreviewRole(r);
                  }
                } else {
                  setActiveRole(r);
                }
                navigate(`/${r}`);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                r === effectiveRole
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
