import React from "react";
import { useAuth } from "./authContext";
import { supabase } from "./supabaseClient";

const CreditsContext = React.createContext(null);

export function CreditsProvider({ children }) {
  const { user } = useAuth();
  const [credits, setCredits] = React.useState(0);
  const [initialized, setInitialized] = React.useState(false);

  // Fetch current credits from the database
  const fetchCredits = React.useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.uid) // user.uid is aliased from supabase user.id
      .single();

    if (!error && data) {
      setCredits(data.credits ?? 0);
    }
  }, [user]);

  // Initialize credits when user session is available.
  // The DB trigger (on_auth_user_created) auto-creates the users row
  // with 2 starter credits on first sign-in, so no manual INSERT needed.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setCredits(0);
        setInitialized(false);
        return;
      }

      await fetchCredits();

      if (!cancelled) {
        setInitialized(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, fetchCredits]);

  const addCredits = React.useCallback(
    async (amount) => {
      if (!user || amount <= 0) return;
      await supabase.rpc("add_credits", {
        p_user_id: user.uid,
        p_amount: amount,
      });
      await fetchCredits();
    },
    [user, fetchCredits]
  );

  const consumeCredits = React.useCallback(
    async (amount) => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("consume_credits", {
        p_user_id: user.uid,
        p_amount: amount,
      });
      const success = !error && data === true;
      if (success) await fetchCredits();
      return success;
    },
    [user, fetchCredits]
  );

  const value = React.useMemo(
    () => ({ credits, addCredits, consumeCredits, initialized, fetchCredits }),
    [credits, addCredits, consumeCredits, initialized, fetchCredits]
  );

  return (
    <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
  );
}

export function useCredits() {
  const ctx = React.useContext(CreditsContext);
  if (!ctx) throw new Error("useCredits must be used within CreditsProvider");
  return ctx;
}
