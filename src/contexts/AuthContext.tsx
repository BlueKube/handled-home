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
  profile: Profile | null;
  loading: boolean;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapAttempted = useRef(false);

  const fetchUserData = async (userId: string, userEmail?: string) => {
    try {
      const [rolesResult, profileResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("full_name, phone, avatar_url").eq("user_id", userId).single(),
      ]);

      let userRoles = rolesResult.data?.map((r) => r.role as AppRole) ?? [];

      // Self-healing bootstrap: if no roles found, attempt bootstrap once
      if (userRoles.length === 0 && !bootstrapAttempted.current) {
        bootstrapAttempted.current = true;
        const displayName = profileResult.data?.full_name || userEmail || "User";
        await supabase.rpc("bootstrap_new_user", { _full_name: displayName });

        // Re-fetch after bootstrap
        const [rolesRetry, profileRetry] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", userId),
          supabase.from("profiles").select("full_name, phone, avatar_url").eq("user_id", userId).single(),
        ]);
        userRoles = rolesRetry.data?.map((r) => r.role as AppRole) ?? [];
        if (profileRetry.data) {
          setProfile(profileRetry.data);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up listener FIRST (non-async to avoid session lock deadlock)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer fetchUserData outside the session lock via setTimeout
          setTimeout(() => fetchUserData(session.user.id, session.user.email ?? undefined), 0);
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
        fetchUserData(session.user.id, session.user.email ?? undefined);
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
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, roles, activeRole, setActiveRole: handleSetActiveRole, profile, loading, signOut }}
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
