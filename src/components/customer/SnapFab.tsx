import { useState } from "react";
import { Camera } from "lucide-react";
import { SnapSheet } from "@/components/customer/SnapSheet";

// Center-slot Snap button rendered by BottomTabBar in the customer app. Visually
// elevated above the tab bar baseline to read as a primary action (the "page of
// the day" capture entry point) without leaving the nav strip.
export function SnapFab() {
  const [open, setOpen] = useState(false);

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
