import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { AccountNotConfigured } from "@/components/AccountNotConfigured";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, roles, activeRole } = useAuth();

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

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to={`/${activeRole}`} replace />;
  }

  return <>{children}</>;
}
