import { useEffect, useRef } from "react";
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
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function setup() {
      const { App } = await import("@capacitor/app");
      if (cancelled) return;

      const listener = await App.addListener("appUrlOpen", async (event) => {
        const url = event.url;

        // Handle Supabase auth callback (email confirmation, password reset)
        // URL format: handledhome://auth/callback#access_token=...&refresh_token=...
        if (url.includes("auth/callback") && (url.includes("access_token") || url.includes("refresh_token"))) {
          const hashIndex = url.indexOf("#");
          if (hashIndex !== -1) {
            const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (accessToken && refreshToken) {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (error) {
                navigateRef.current("/auth?error=session_expired");
                return;
              }
              navigateRef.current("/");
              return;
            }
          }
        }

        // Handle other deep links (e.g., handledhome://provider/jobs/123)
        try {
          const parsed = new URL(url);
          const path = parsed.host + (parsed.pathname || "");
          if (path && path !== "/") {
            navigateRef.current("/" + path);
          }
        } catch {
          // Invalid URL, ignore
        }
      });

      cleanup = () => listener.remove();
    }

    setup();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
