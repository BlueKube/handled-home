import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw } from "lucide-react";

export function AccountNotConfigured() {
  const { user, bootstrapError, retryBootstrap, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 safe-top">
      <div className="flex flex-col items-center text-center max-w-xs">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Account Not Configured</h1>
        <p className="text-muted-foreground text-sm mb-4">
          {bootstrapError
            ? bootstrapError
            : "Your account hasn't been assigned a role yet. Please contact support for assistance."}
        </p>
        {user?.email && (
          <p className="text-xs text-muted-foreground mb-6">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}
        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={retryBootstrap}
            variant="default"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={signOut}
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
