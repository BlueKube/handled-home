import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_PRIORITY, STORAGE_KEYS } from "@/constants/roles";

export type AppRole = "customer" | "provider" | "admin";

export interface Profile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  previewRole: AppRole | null;
  setPreviewRole: (role: AppRole | null) => void;
  effectiveRole: AppRole;
  profile: Profile | null;
  loading: boolean;
  bootstrapError: string | null;
  retryBootstrap: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function resolveActiveRole(roles: AppRole[], stored: string | null): AppRole {
  if (stored && roles.includes(stored as AppRole)) {
    return stored as AppRole;
  }
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return r;
  }
  return "customer";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRole] = useState<AppRole>("customer");
  const [previewRole, setPreviewRoleState] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const effectiveRole: AppRole = previewRole ?? activeRole;

  const setPreviewRole = (role: AppRole | null) => {
    setPreviewRoleState(role);
  };
  const [loading, setLoading] = useState(true);
  const bootstrapAttempted = useRef(false);

  const fetchUserData = async (userId: string, userEmail?: string, userMeta?: Record<string, unknown>) => {
    try {
      const [rolesResult, profileResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("full_name, phone, avatar_url").eq("user_id", userId).single(),
      ]);

      let userRoles = rolesResult.data?.map((r) => r.role as AppRole) ?? [];

      // Self-healing bootstrap: if no roles found, attempt bootstrap once
      if (userRoles.length === 0 && !bootstrapAttempted.current) {
        bootstrapAttempted.current = true;
        setBootstrapError(null);
        const displayName = profileResult.data?.full_name || userEmail || "User";
        // Always bootstrap as customer — provider role requires admin approval
        const { error: bootstrapErr } = await supabase.rpc("bootstrap_new_user", {
          _full_name: displayName,
          _role: "customer",
        });

        if (bootstrapErr) {
          console.error("Bootstrap RPC failed:", bootstrapErr);
          setBootstrapError("Account setup failed. Please try again or contact support.");
        } else {
          // Re-fetch after bootstrap
          const [rolesRetry, profileRetry] = await Promise.all([
            supabase.from("user_roles").select("role").eq("user_id", userId),
            supabase.from("profiles").select("full_name, phone, avatar_url").eq("user_id", userId).single(),
          ]);
          userRoles = rolesRetry.data?.map((r) => r.role as AppRole) ?? [];
          if (profileRetry.data) {
            setProfile(profileRetry.data);
          }
        }
      } else if (profileResult.data) {
        setProfile(profileResult.data);
      }

      if (userRoles.length > 0) {
        setRoles(userRoles);
        const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
        const resolved = resolveActiveRole(userRoles, stored);
        setActiveRole(resolved);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, resolved);
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.error("fetchUserData error:", err);
      setBootstrapError("Something went wrong loading your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const retryBootstrap = () => {
    if (!user) return;
    bootstrapAttempted.current = false;
    setBootstrapError(null);
    setLoading(true);
    fetchUserData(user.id, user.email ?? undefined, user.user_metadata);
  };

  useEffect(() => {
    // Set up listener FIRST (non-async to avoid session lock deadlock)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer fetchUserData outside the session lock via setTimeout
          setTimeout(() => fetchUserData(session.user.id, session.user.email ?? undefined, session.user.user_metadata), 0);
        } else {
          setRoles([]);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email ?? undefined, session.user.user_metadata);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSetActiveRole = (role: AppRole) => {
    setActiveRole(role);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setProfile(null);
    setActiveRole("customer");
    bootstrapAttempted.current = false;
    setBootstrapError(null);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    setPreviewRoleState(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, roles, activeRole, setActiveRole: handleSetActiveRole, previewRole, setPreviewRole, effectiveRole, profile, loading, bootstrapError, retryBootstrap, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
