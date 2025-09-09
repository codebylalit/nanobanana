import React from "react";
import { useAuth } from "./authContext";
import { supabase } from "./supabaseClient";

const CreditsContext = React.createContext(null);

export function CreditsProvider({ children }) {
  const { user } = useAuth();
  const [credits, setCredits] = React.useState(0);
  const [initialized, setInitialized] = React.useState(false);

  // Function to fetch credits from database
  const fetchCredits = React.useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.uid)
      .single();

    if (!error && data) {
      setCredits(data.credits ?? 0);
    }
  }, [user]);

  // Initialize credits for user (Supabase)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setCredits(0);
        setInitialized(false);
        return;
      }

      // Ensure a user row exists without overwriting existing credits
      const existing = await supabase
        .from("users")
        .select("id")
        .eq("id", user.uid)
        .single();

      if (existing.error && existing.error.code === "PGRST116") {
        // No row found, create with starter credits
        const insertRes = await supabase
          .from("users")
          .insert({ id: user.uid, credits: 2 });
        if (insertRes.error) {
          console.error("Error inserting user:", insertRes.error);
          setCredits(0);
          setInitialized(true);
          return;
        }
      } else if (existing.error && existing.error.code !== "PGRST116") {
        console.error("Error checking user existence:", existing.error);
        setCredits(0);
        setInitialized(true);
        return;
      }

      // Fetch initial credits
      await fetchCredits();

      if (!cancelled) {
        setInitialized(true);
      }
    })();
  }, [user, fetchCredits]);

  // No local persistence; Supabase is the source of truth

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
