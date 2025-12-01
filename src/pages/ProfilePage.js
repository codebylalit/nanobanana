import React from "react";
import { useAuth } from "../authContext";
import { useCredits } from "../creditsContext";
import { useToast } from "../toastContext";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { updateProfile } from "firebase/auth";
import { getFeatureOptIn, setFeatureOptIn } from "../userPrefs";
import {
  getUserApiKey as getGeminiUserApiKey,
  upsertUserApiKey as saveGeminiUserApiKey,
  deleteUserApiKey as removeGeminiUserApiKey,
} from "../userApiKeyService";

export default function ProfilePage() {
  const { user } = useAuth();
  const {
    credits,
    initialized: creditsInitialized,
    fetchCredits,
  } = useCredits();
  const { show } = useToast();
  const navigate = useNavigate();
  const [featureOptIn, setFeatureOptInState] = React.useState(false);
  const [editingName, setEditingName] = React.useState(false);
  const [displayName, setDisplayName] = React.useState("");
  const [savingName, setSavingName] = React.useState(false);
  const [apiKey, setApiKey] = React.useState("");
  const [apiKeyLoading, setApiKeyLoading] = React.useState(false);
  const [apiKeySaving, setApiKeySaving] = React.useState(false);

  React.useEffect(() => {
    if (user?.uid) {
      setFeatureOptInState(getFeatureOptIn(user.uid));
      setDisplayName(user.displayName || "");
    }
  }, [user]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid) {
        setApiKey("");
        return;
      }
      setApiKeyLoading(true);
      try {
        const key = await getGeminiUserApiKey(user.uid);
        if (!cancelled) setApiKey(key || "");
      } catch (e) {
        console.error("Failed to load stored API key", e);
      } finally {
        if (!cancelled) setApiKeyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6">
      {/* Page header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-3xl font-bold text-gray-900">Profile</h2>
        <p className="text-gray-700 text-xs sm:text-lg">
          Manage your account details and preferences.
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Header card */}
        <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center overflow-hidden">
              {user.displayName || user.email ? (
                <span className="text-xl sm:text-2xl font-bold">
                  {(user.displayName || user.email).slice(0, 1).toUpperCase()}
                </span>
              ) : (
                <svg
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                {!editingName ? (
                  <>
                    <h3 className="text-base sm:text-2xl font-semibold text-gray-900 truncate">
                      {user.displayName || "Unnamed user"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingName(true)}
                      className="text-xs sm:text-base px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 w-full max-w-md">
                    <input
                      className="flex-1 rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter display name"
                    />
                    <button
                      type="button"
                      disabled={savingName}
                      onClick={async () => {
                        try {
                          setSavingName(true);
                          await updateProfile(auth.currentUser, {
                            displayName: displayName.trim() || null,
                          });
                          show({
                            title: "Saved",
                            message: "Display name updated.",
                            type: "success",
                          });
                          setEditingName(false);
                        } catch (err) {
                          show({
                            title: "Error",
                            message: err.message || "Failed to update name.",
                            type: "error",
                          });
                        } finally {
                          setSavingName(false);
                        }
                      }}
                      className="text-xs sm:text-base px-3 py-1.5 sm:py-2 rounded-md bg-yellow-400 text-black font-semibold hover:bg-yellow-300 disabled:opacity-50"
                    >
                      {savingName ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingName(false)}
                      className="text-xs sm:text-base px-3 py-1.5 sm:py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-700 text-xs sm:text-base truncate">
                {user.email}
              </p>
            </div>
          </div>
        </section>

        {/* Credits card */}
        <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center">
            <div className="flex items-center justify-between sm:block">
              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
                  Available credits
                </h3>
                <p className="text-xl sm:text-4xl font-extrabold text-yellow-500">
                  {creditsInitialized ? credits : "—"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/dashboard-pricing")}
                className="flex-1 sm:flex-none rounded-lg sm:rounded-xl bg-yellow-400 text-black font-bold px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base hover:bg-yellow-300"
              >
                Buy credits
              </button>
              <button
                type="button"
                onClick={() => fetchCredits()}
                className="flex-1 sm:flex-none rounded-lg sm:rounded-xl border border-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        {/* User info */}
        <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-6">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
            User information
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-base">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="text-gray-900 break-all">
                {user.displayName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900 break-all">{user.email || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">User ID</dt>
              <dd className="text-gray-900 break-all flex items-center gap-2">
                <span className="truncate">{user.uid}</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(user.uid);
                      show({
                        title: "Copied",
                        message: "User ID copied to clipboard.",
                        type: "success",
                      });
                    } catch (_) {
                      show({
                        title: "Copy failed",
                        message: "Could not copy user ID.",
                        type: "error",
                      });
                    }
                  }}
                  className="text-xs sm:text-sm px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Copy
                </button>
              </dd>
            </div>
          </dl>
        </section>

        {/* Gemini API key management */}
        <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-6">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
            Gemini API key
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3">
            Bring your own Google Gemini API key for image generation. This key is stored securely in your account and used directly with Google (not via RapidAPI).
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                apiKeyLoading
                  ? "Loading your saved key..."
                  : "Enter your Gemini API key"
              }
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="button"
              disabled={apiKeySaving || !apiKey.trim()}
              onClick={async () => {
                if (!user?.uid || !apiKey.trim()) return;
                try {
                  setApiKeySaving(true);
                  await saveGeminiUserApiKey(user.uid, apiKey.trim());
                  show({
                    title: "Saved",
                    message: "Gemini API key updated.",
                    type: "success",
                  });
                } catch (err) {
                  show({
                    title: "Error",
                    message:
                      err?.message || "Failed to save Gemini API key.",
                    type: "error",
                  });
                } finally {
                  setApiKeySaving(false);
                }
              }}
              className="rounded-lg bg-yellow-400 text-black font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm hover:bg-yellow-300 disabled:opacity-50"
            >
              {apiKeySaving ? "Saving..." : apiKey ? "Update key" : "Save key"}
            </button>
            {apiKey && (
              <button
                type="button"
                onClick={async () => {
                  if (!user?.uid) return;
                  try {
                    await removeGeminiUserApiKey(user.uid);
                    setApiKey("");
                    show({
                      title: "Removed",
                      message: "Gemini API key removed.",
                      type: "success",
                    });
                  } catch (err) {
                    show({
                      title: "Error",
                      message:
                        err?.message || "Failed to remove Gemini API key.",
                      type: "error",
                    });
                  }
                }}
                className="rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-xs sm:text-sm hover:bg-gray-50"
              >
                Remove
              </button>
            )}
          </div>
        </section>

        {/* Community gallery */}
        <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
                Community gallery
              </h3>
              <p className="text-xs sm:text-base text-gray-600">
                Feature my generated images in the public gallery.
              </p>
            </div>
            <input
              id="feature-opt-in"
              type="checkbox"
              checked={featureOptIn}
              onChange={(e) => {
                const next = e.target.checked;
                setFeatureOptInState(next);
                setFeatureOptIn(user.uid, next);
              }}
              className="h-5 w-5 sm:h-6 sm:w-6 cursor-pointer rounded-md border-gray-300 
                text-black checked:bg-yellow-400 checked:border-yellow-400 
                focus:ring-yellow-400"
            />
          </div>
        </section>

        {/* Account actions */}
        <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => window.location.assign("/previous-images")}
              className="rounded-md sm:rounded-lg border border-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base hover:bg-gray-50"
            >
              View my images
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
