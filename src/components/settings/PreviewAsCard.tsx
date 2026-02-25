import { useNavigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";

const previewOptions: { role: AppRole; label: string }[] = [
  { role: "customer", label: "Customer" },
  { role: "provider", label: "Provider" },
  { role: "admin", label: "Admin" },
];

export function PreviewAsCard() {
  const { activeRole, effectiveRole, setPreviewRole } = useAuth();
  const navigate = useNavigate();

  if (activeRole !== "admin") return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-muted-foreground" />
          Preview As
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          View the app as a different role for demos and screenshots.
        </p>
        <div className="flex gap-2 flex-wrap">
          {previewOptions.map(({ role, label }) => (
            <button
              key={role}
              onClick={() => {
                if (role === "admin") {
                  setPreviewRole(null);
                } else {
                  setPreviewRole(role);
                }
                navigate(`/${role}`);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                effectiveRole === role
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
