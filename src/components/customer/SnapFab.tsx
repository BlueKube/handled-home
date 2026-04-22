import { useState } from "react";
import { Camera } from "lucide-react";
import { SnapSheet } from "@/components/customer/SnapSheet";

// Floating capture button rendered above the bottom tab bar on customer
// screens. Phase 5 replaces the 5-tab nav with a 4-tab + center-FAB layout
// and this component relocates into that slot; until then it's an overlay.
export function SnapFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Snap a fix"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
        className="fixed left-1/2 -translate-x-1/2 z-50 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 flex items-center justify-center transition-transform duration-150 active:scale-90 hover:shadow-accent/50"
      >
        <Camera className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <SnapSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
