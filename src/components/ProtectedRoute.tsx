import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { AccountNotConfigured } from "@/components/AccountNotConfigured";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, roles, activeRole, effectiveRole, previewRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (roles.length === 0) {
    return <AccountNotConfigured />;
  }

  // Allow admin users to preview any role
  if (requiredRole && effectiveRole !== requiredRole) {
    if (activeRole === "admin" && previewRole) {
      // Admin is previewing — allow access
    } else {
      return <Navigate to={`/${effectiveRole}`} replace />;
    }
  }

  return <>{children}</>;
}
