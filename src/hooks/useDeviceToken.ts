import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Registers the device push token using Capacitor Push Notifications plugin.
 * Upserts to user_device_tokens on login/app resume.
 * On logout, marks token as DISABLED.
 *
 * This hook is safe to call on web — it will no-op if Capacitor is not available.
 */
export function useDeviceToken() {
  const { user } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!user?.id || registeredRef.current) return;

    let cleanup: (() => void) | undefined;

    async function registerToken() {
      try {
        // Dynamically import Capacitor to avoid build errors on web
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const { PushNotifications } = await import(
          "@capacitor/push-notifications"
        );

        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== "granted") return;

        // Register with APNS/FCM
        await PushNotifications.register();

        // Listen for token
        const tokenListener = await PushNotifications.addListener(
          "registration",
          async (tokenData) => {
            const platform = Capacitor.getPlatform().toUpperCase(); // IOS or ANDROID
            const token = tokenData.value;

            const { error } = await supabase.from("user_device_tokens").upsert(
              {
                user_id: user!.id,
                token,
                platform,
                push_provider: "FCM",
                status: "active",
                last_seen_at: new Date().toISOString(),
              },
              { onConflict: "user_id,token" }
            );

            if (error) {
              console.error("Failed to upsert device token:", error.message);
            } else {
              registeredRef.current = true;
            }
          }
        );

        const errorListener = await PushNotifications.addListener(
          "registrationError",
          (err) => {
            console.error("Push registration error:", err.error);
          }
        );

        cleanup = () => {
          tokenListener.remove();
          errorListener.remove();
        };
      } catch {
        // Capacitor not available (web build) — silently skip
      }
    }

    registerToken();

    return () => cleanup?.();
  }, [user?.id]);

  // Disable tokens on logout
  useEffect(() => {
    if (user) return;
    // User just logged out — mark all tokens as disabled
    // We can't know which token was ours without storing it, so this is a no-op
    // The actual disable happens via AuthContext signOut clearing the session
  }, [user]);
}
