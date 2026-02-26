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
  const tokenRef = useRef<string | null>(null);

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
            tokenRef.current = token;

            const { error } = await supabase.from("user_device_tokens").upsert(
              {
                user_id: user!.id,
                token,
                platform,
                push_provider: "FCM",
                status: "ACTIVE",
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

  // Disable token on logout
  useEffect(() => {
    if (user) return;
    if (!tokenRef.current) return;

    const token = tokenRef.current;
    tokenRef.current = null;
    registeredRef.current = false;

    supabase
      .from("user_device_tokens")
      .update({ status: "DISABLED" })
      .eq("token", token)
      .then(({ error }) => {
        if (error) console.error("Failed to disable device token:", error.message);
      });
  }, [user]);
}
