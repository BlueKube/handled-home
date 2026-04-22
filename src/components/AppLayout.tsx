import { Outlet } from "react-router-dom";
import { BottomTabBar } from "@/components/BottomTabBar";
import { AppHeader } from "@/components/AppHeader";
import { SnapFab } from "@/components/customer/SnapFab";
import { useDeviceToken } from "@/hooks/useDeviceToken";
import { useDeepLinks } from "@/hooks/useDeepLinks";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, X } from "lucide-react";

export function AppLayout() {
  useDeviceToken();
  useDeepLinks();
  const { previewRole, setPreviewRole, effectiveRole } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      {previewRole && (
        <div className="bg-amber-900/60 border-b border-amber-700/50 px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium text-amber-200">
          <Eye className="h-3.5 w-3.5" />
          <span>Previewing as <span className="capitalize font-semibold">{previewRole}</span></span>
          <button
            onClick={() => setPreviewRole(null)}
            className="ml-2 rounded-full p-0.5 hover:bg-amber-800/60 transition-colors"
            aria-label="Exit preview mode"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <AppHeader />
      <main id="main-content" className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>
      {effectiveRole === "customer" && <SnapFab />}
      <BottomTabBar />
    </div>
  );
}
