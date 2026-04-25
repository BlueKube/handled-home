import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Camera } from "lucide-react";
import { SnapSheet } from "@/components/customer/SnapSheet";

// Center-slot Snap button rendered by BottomTabBar in the customer app. Visually
// elevated above the tab bar baseline to read as a primary action (the "page of
// the day" capture entry point) without leaving the nav strip.
//
// Also consumes the `?snap=1` URL contract so deep links (e.g. from Visit
// Detail's Preview/Live "Add a Snap" CTAs) auto-open the sheet on landing.
// Mirrors the `?drawer=true` pattern from `AvatarDrawer.tsx` (Batch 5.2):
// once consumed, the param is stripped via `setSearchParams(..., {replace:true})`
// so back/forward navigation doesn't re-trigger.
export function SnapFab() {
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (searchParams.get("snap") !== "1") return;
    const next = new URLSearchParams(searchParams);
    next.delete("snap");
    setSearchParams(next, { replace: true });
    if (!autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setOpen(true);
    }
  }, [searchParams, setSearchParams]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Snap a fix"
        className="absolute left-1/2 -translate-x-1/2 -top-5 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 flex items-center justify-center transition-transform duration-150 active:scale-90 hover:shadow-accent/50 ring-4 ring-card/90"
      >
        <Camera className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <SnapSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
