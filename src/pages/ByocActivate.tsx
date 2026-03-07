import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Thin auth-gate redirect for BYOC invite links.
 * - If not authenticated → redirect to /auth with return URL
 * - If authenticated → redirect to the BYOC onboarding wizard
 */
export default function ByocActivate() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate(`/auth?redirect=/customer/onboarding/byoc/${token}`, { replace: true });
    } else {
      navigate(`/customer/onboarding/byoc/${token}`, { replace: true });
    }
  }, [user, loading, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
