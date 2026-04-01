import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles deep links on iOS/Android via the handledhome:// URL scheme.
 * When a user taps an auth confirmation email link, the OS opens the app
 * with the confirmation URL. This hook intercepts that and completes the auth flow.
 *
 * Safe to call on web — it no-ops if Capacitor is not available.
 */
export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    async function setup() {
      const { App } = await import("@capacitor/app");

      const listener = await App.addListener("appUrlOpen", async (event) => {
        const url = event.url;

        // Handle Supabase auth callback (email confirmation, password reset)
        // URL format: handledhome://auth/callback#access_token=...&refresh_token=...
        if (url.includes("access_token") || url.includes("refresh_token")) {
          // Extract the hash fragment and pass to Supabase
          const hashIndex = url.indexOf("#");
          if (hashIndex !== -1) {
            const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              navigate("/");
              return;
            }
          }
        }

        // Handle other deep links (e.g., handledhome://provider/jobs/123)
        try {
          const parsed = new URL(url);
          const path = parsed.pathname || parsed.host;
          if (path && path !== "/") {
            navigate(path);
          }
        } catch {
          // Invalid URL, ignore
        }
      });

      cleanup = () => listener.remove();
    }

    setup();

    return () => {
      cleanup?.();
    };
  }, [navigate]);
}
