import { supabase } from "./supabaseClient";

// Provider constant for Gemini via RapidAPI
const PROVIDER = "gemini_rapidapi";

export async function getUserApiKey(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("api_key")
    .eq("user_id", userId)
    .eq("provider", PROVIDER)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user API key", error);
    return null;
  }

  return data?.api_key || null;
}

export async function upsertUserApiKey(userId, apiKey) {
  if (!userId) throw new Error("Missing userId");
  if (!apiKey) throw new Error("Missing apiKey");

  const { error } = await supabase.from("user_api_keys").upsert(
    {
      user_id: userId,
      provider: PROVIDER,
      api_key: apiKey,
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    console.error("Error upserting user API key", error);
    throw error;
  }
}

export async function deleteUserApiKey(userId) {
  if (!userId) return;
  const { error } = await supabase
    .from("user_api_keys")
    .delete()
    .eq("user_id", userId)
    .eq("provider", PROVIDER);

  if (error) {
    console.error("Error deleting user API key", error);
    throw error;
  }
}
