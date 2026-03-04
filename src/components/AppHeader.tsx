import { NotificationBell } from "./NotificationBell";

export function AppHeader() {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 safe-top relative">
      <div className="flex-1" />
      <span className="font-['Plus_Jakarta_Sans'] font-bold tracking-tight text-xl select-none">
        <span style={{ color: "hsl(220 20% 10%)" }}>Handled</span>
        <span style={{ color: "hsl(200 80% 50%)" }}>Home</span>
      </span>
      <div className="flex-1 flex justify-end">
        <NotificationBell />
      </div>
    </header>
  );
}
