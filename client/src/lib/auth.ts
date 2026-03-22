import type {
  AuthSession,
  ChatModePreference,
  PreferredGender,
} from "@/types";

const AUTH_STORAGE_KEY = "vibemeet-auth";
const AGE_GATE_KEY = "vibemeet-age-confirmed";
const MATCH_PREFERENCE_KEY = "vibemeet-match-preference";
const CHAT_MODE_KEY = "vibemeet-chat-mode";
const INTERESTS_KEY = "vibemeet-interests";

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function hasConfirmedAge() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(AGE_GATE_KEY) === "true";
}

export function confirmAgeGate() {
  window.localStorage.setItem(AGE_GATE_KEY, "true");
}

export function getMatchPreference(): PreferredGender {
  if (typeof window === "undefined") {
    return "ANY";
  }

  const value = window.localStorage.getItem(MATCH_PREFERENCE_KEY);
  if (!value) {
    return "ANY";
  }

  return value as PreferredGender;
}

export function saveMatchPreference(preference: PreferredGender) {
  window.localStorage.setItem(MATCH_PREFERENCE_KEY, preference);
}

export function getChatModePreference(): ChatModePreference {
  if (typeof window === "undefined") {
    return "VOICE_TEXT";
  }

  const value = window.localStorage.getItem(CHAT_MODE_KEY);
  if (!value) {
    return "VOICE_TEXT";
  }

  return value as ChatModePreference;
}

export function saveChatModePreference(preference: ChatModePreference) {
  window.localStorage.setItem(CHAT_MODE_KEY, preference);
}

function normalizeInterestValue(value: string) {
  return value
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function getInterestPreferences() {
  if (typeof window === "undefined") {
    return [];
  }

  const value = window.localStorage.getItem(INTERESTS_KEY);
  if (!value) {
    return [];
  }

  return normalizeInterestValue(value);
}

export function saveInterestPreferences(interests: string[] | string) {
  const normalized =
    typeof interests === "string"
      ? normalizeInterestValue(interests)
      : normalizeInterestValue(interests.join(","));

  window.localStorage.setItem(INTERESTS_KEY, normalized.join(", "));
}
