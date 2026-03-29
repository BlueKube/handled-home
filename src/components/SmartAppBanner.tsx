import { useState } from "react";
import { X, Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Capacitor } from "@capacitor/core";

const DISMISS_KEY = "smart_app_banner_dismissed_at";
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isDismissed(): boolean {
  const val = localStorage.getItem(DISMISS_KEY);
  if (!val) return false;
  return Date.now() - parseInt(val, 10) < DISMISS_DURATION_MS;
}

export function SmartAppBanner() {
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useState(isDismissed);

  // Don't show on native apps (Capacitor) — user already has the app
  if (Capacitor.isNativePlatform()) return null;
  if (!isMobile || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <div className="relative flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Smartphone className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Get the app</p>
        <p className="text-xs text-muted-foreground">Open faster next time from your home screen.</p>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Dismiss app banner"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
