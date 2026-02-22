import { Outlet } from "react-router-dom";
import { BottomTabBar } from "@/components/BottomTabBar";
import { AppHeader } from "@/components/AppHeader";

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
