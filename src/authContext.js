import React from "react";
import { supabase } from "./supabaseClient";

const AuthContext = React.createContext(null);

/**
 * Normalizes a Supabase user object into the shape the rest of the app expects.
 * - Adds `uid` as an alias for `id` so existing code (user.uid) keeps working.
 * - Adds `displayName` from user_metadata (Google OAuth populates full_name / name).
 * - Adds `getIdToken()` that returns the current Supabase JWT (used by paymentService).
 */
function normalizeUser(supabaseUser) {
  if (!supabaseUser) return null;
  return {
    ...supabaseUser,
    uid: supabaseUser.id,
    displayName:
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      null,
    email: supabaseUser.email,
    getIdToken: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || "";
    },
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Resolve the current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? normalizeUser(session.user) : null);
      setLoading(false);
    });

    // Subscribe to auth state changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? normalizeUser(session.user) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = React.useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // After Google OAuth redirect, land back on the app root
        redirectTo: window.location.origin,
      },
    });
  }, []);

  const signOutFn = React.useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = React.useMemo(
    () => ({ user, loading, signIn, signOut: signOutFn }),
    [user, loading, signIn, signOutFn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
