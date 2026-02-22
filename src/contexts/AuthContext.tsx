import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  // Deterministic: customer > provider > admin
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

  const fetchUserData = async (userId: string) => {
    const [rolesResult, profileResult] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("full_name, phone, avatar_url").eq("user_id", userId).single(),
    ]);

    if (rolesResult.data && rolesResult.data.length > 0) {
      const userRoles = rolesResult.data.map((r) => r.role as AppRole);
      setRoles(userRoles);
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
      const resolved = resolveActiveRole(userRoles, stored);
      setActiveRole(resolved);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, resolved);
    } else {
      setRoles([]);
    }

    if (profileResult.data) {
      setProfile(profileResult.data);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setRoles([]);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setLoading(false);
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
