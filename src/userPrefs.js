const PREFS_KEY = "nb_prefs_v1";

function loadAllPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveAllPrefs(allPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(allPrefs));
  } catch (e) {
    console.warn("Failed to save preferences", e);
  }
}

export function getUserPrefs(userId) {
  const all = loadAllPrefs();
  return all[userId] || { featureOptIn: false };
}

export function setUserPrefs(userId, prefs) {
  const all = loadAllPrefs();
  all[userId] = { ...getUserPrefs(userId), ...prefs };
  saveAllPrefs(all);
}

export function getFeatureOptIn(userId) {
  return Boolean(getUserPrefs(userId).featureOptIn);
}

export function setFeatureOptIn(userId, value) {
  setUserPrefs(userId, { featureOptIn: Boolean(value) });
}


