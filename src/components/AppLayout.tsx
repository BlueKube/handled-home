import { Outlet } from "react-router-dom";
import { BottomTabBar } from "@/components/BottomTabBar";
import { AppHeader } from "@/components/AppHeader";
import { useDeviceToken } from "@/hooks/useDeviceToken";
import { useDeepLinks } from "@/hooks/useDeepLinks";

export function AppLayout() {
  useDeviceToken();
  useDeepLinks();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      <AppHeader />
      <main id="main-content" className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
