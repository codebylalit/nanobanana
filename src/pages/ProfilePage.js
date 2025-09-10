import React from "react";
import { useAuth } from "../authContext";
import { getFeatureOptIn, setFeatureOptIn } from "../userPrefs";

export default function ProfilePage() {
  const { user } = useAuth();
  const [featureOptIn, setFeatureOptInState] = React.useState(false);

  React.useEffect(() => {
    if (user?.uid) {
      setFeatureOptInState(getFeatureOptIn(user.uid));
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Profile</h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage your account details and preferences.
        </p>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">
            User information
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
              <dd className="text-gray-900 break-all">{user.uid}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                Community gallery
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Feature my generated images in the public gallery.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={featureOptIn}
              onClick={() => {
                const next = !featureOptIn;
                setFeatureOptInState(next);
                setFeatureOptIn(user.uid, next);
              }}
              className={`relative inline-flex h-6 w-10 sm:h-7 sm:w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                featureOptIn ? "bg-yellow-400" : "bg-gray-300"
              }`}
              aria-label="Toggle community gallery opt-in"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  featureOptIn
                    ? "translate-x-4 sm:translate-x-5"
                    : "translate-x-0.5 sm:translate-x-1"
                }`}
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
