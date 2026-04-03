import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Initializes native-only features: hides splash screen and configures status bar.
 * Safe to call on web — no-ops if Capacitor is not available.
 * Call once at the app root level (App.tsx), not inside protected routes.
 */
export function useNativeInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    async function init() {
      // Hide splash screen after the app has rendered
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {
        // SplashScreen plugin not available — ignore
      }

      // Configure status bar for dark theme
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setOverlaysWebView({ overlay: true });
      } catch {
        // StatusBar plugin not available — ignore
      }
    }

    init();
  }, []);
}
