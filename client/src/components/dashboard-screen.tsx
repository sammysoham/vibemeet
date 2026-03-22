"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Crown,
  LogOut,
  MessageSquareMore,
  Shield,
  Sparkles,
  UserRoundPlus,
  UsersRound,
  Video,
} from "lucide-react";
import { AgeGate } from "@/components/age-gate";
import { api } from "@/lib/api";
import {
  clearAuthSession,
  getAuthSession,
  getInterestPreferences,
  saveAuthSession,
  saveInterestPreferences,
  saveMatchPreference,
} from "@/lib/auth";
import type { Friend, PreferredGender, User } from "@/types";

const FILTER_OPTIONS: { value: PreferredGender; label: string }[] = [
  { value: "ANY", label: "Any gender" },
  { value: "FEMALE", label: "Women only" },
  { value: "MALE", label: "Men only" },
  { value: "UNSPECIFIED", label: "Prefer not to say" },
];

export function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [preferredGender, setPreferredGender] = useState<PreferredGender>("ANY");
  const [interestInput, setInterestInput] = useState("");
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);
  const [notice, setNotice] = useState("");
  const selectedInterests = interestInput
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean)
    .slice(0, 8);

  useEffect(() => {
    const session = getAuthSession();

    if (!session) {
      router.replace("/");
      return;
    }

    setUser(session.user);
    setPreferredGender(
      (window.localStorage.getItem("vibemeet-match-preference") as PreferredGender) ||
        "ANY",
    );
    setInterestInput(getInterestPreferences().join(", "));
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadOnlineCount() {
      try {
        const response = await api.getOnlineCount();
        if (!cancelled) {
          setOnlineCount(response.count);
        }
      } catch {
        if (!cancelled) {
          setOnlineCount(0);
        }
      }
    }

    loadOnlineCount();
    const interval = window.setInterval(loadOnlineCount, 10000);

    const params = new URLSearchParams(window.location.search);
    if (params.get("premium") === "success") {
      setNotice(
        "Stripe checkout completed. Add a webhook next if you want live subscription activation.",
      );
    }

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFriends() {
      if (!user?.isPremium) {
        setFriends([]);
        return;
      }

      try {
        const response = await api.listFriends();
        if (!cancelled) {
          setFriends(response.friends);
        }
      } catch {
        if (!cancelled) {
          setFriends([]);
        }
      }
    }

    loadFriends();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.isPremium]);

  async function handleUpgrade() {
    setLoadingUpgrade(true);
    setNotice("");

    try {
      const response = await api.checkout();

      if (response.demoMode && response.user) {
        const session = getAuthSession();
        if (session) {
          saveAuthSession({ ...session, user: response.user });
        }
        setUser(response.user);
        setNotice(response.message || "Premium enabled in local demo mode.");
        return;
      }

      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (upgradeError) {
      setNotice(
        upgradeError instanceof Error
          ? upgradeError.message
          : "Could not start checkout.",
      );
    } finally {
      setLoadingUpgrade(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <AgeGate />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,111,111,0.2),_transparent_20%),radial-gradient(circle_at_85%_10%,_rgba(88,193,255,0.24),_transparent_18%),linear-gradient(180deg,_#fff8ef_0%,_#fff4ec_100%)] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col rounded-[2.6rem] border border-[#efd7ca] bg-white/78 p-5 shadow-[0_30px_90px_rgba(237,144,102,0.14)] backdrop-blur-xl sm:p-6">
          <header className="flex flex-col gap-4 border-b border-[#edd8cb] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d0bf] bg-[#fff6f0] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#ff6b6b]">
                <Sparkles className="h-3.5 w-3.5" />
                VibeMeet Dashboard
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#2b1f45] sm:text-4xl">
                Welcome back, {user.displayName}
              </h1>
              <p className="mt-2 text-sm text-[#6f6488]">
                Anonymous profile ready. {user.isPremium ? "Premium is active." : "Free mode is active."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                clearAuthSession();
                router.replace("/");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ebd3c5] bg-white px-4 py-2 text-sm text-[#3e3158] transition hover:bg-[#fff4ed]"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </header>

          <main className="flex flex-1 flex-col gap-5 py-6 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
            <section className="flex flex-col justify-between rounded-[2.3rem] border border-[#edd7cb] bg-[linear-gradient(145deg,#fff6eb_0%,#fffefd_55%,#ffe7d8_100%)] p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#ff6b6b]/75">
                  Ready when you are
                </p>
                <h2 className="mt-4 max-w-lg text-4xl font-semibold tracking-[-0.06em] text-[#2b1f45]">
                  Start a bright, fast random chat without the old-web weirdness.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-[#62567b]">
                  Watch the queue, pick live or text-only, and move fast until
                  the vibe feels right.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.7rem] border border-[#eed8cb] bg-white/80 p-4">
                  <UsersRound className="h-5 w-5 text-[#ff6b6b]" />
                  <p className="mt-4 text-3xl font-semibold text-[#2b1f45]">{onlineCount}</p>
                  <p className="mt-1 text-sm text-[#6f6488]">Online now</p>
                </div>
                <div className="rounded-[1.7rem] border border-[#eed8cb] bg-white/80 p-4">
                  <Shield className="h-5 w-5 text-[#4aa9ff]" />
                  <p className="mt-4 text-lg font-semibold text-[#2b1f45]">18+ only</p>
                  <p className="mt-1 text-sm text-[#6f6488]">Safety gate and reporting built in</p>
                </div>
                <div className="rounded-[1.7rem] border border-[#eed8cb] bg-white/80 p-4">
                  <Crown className="h-5 w-5 text-[#ff8a4c]" />
                  <p className="mt-4 text-lg font-semibold text-[#2b1f45]">
                    {user.isPremium ? "Premium live" : "Free mode"}
                  </p>
                  <p className="mt-1 text-sm text-[#6f6488]">
                    {user.isPremium
                      ? "Friends, media sharing, filters, and more video access."
                      : "Unlimited text chat and 3 free video chats each day."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/chat?mode=voice")}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#ff6b6b] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#f05a5a]"
              >
                <Video className="h-5 w-5" />
                Start Live Chat
              </button>

              <button
                type="button"
                onClick={() => router.push("/chat?mode=text")}
                className="mt-3 inline-flex w-full items-center justify-center gap-3 rounded-full border border-[#ecd6ca] bg-white px-6 py-4 text-base font-semibold text-[#2b1f45] transition hover:bg-[#fff5ef]"
              >
                <MessageSquareMore className="h-5 w-5" />
                Start Text Chat
              </button>
            </section>

            <section className="flex flex-col gap-5">
              <div className="rounded-[2.2rem] border border-[#ead6ca] bg-white/82 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-[#7d7297]">
                      Match filters
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-[#2b1f45]">
                      Advanced filtering
                    </h3>
                  </div>
                  <span className="rounded-full border border-[#ecd9cd] px-3 py-1 text-xs text-[#6c617f]">
                    {user.isPremium ? "Unlocked" : "Premium"}
                  </span>
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm text-[#615676]">
                    Preferred gender
                  </span>
                  <select
                    disabled={!user.isPremium}
                    value={preferredGender}
                    onChange={(event) => {
                      const value = event.target.value as PreferredGender;
                      setPreferredGender(value);
                      saveMatchPreference(value);
                    }}
                    className="w-full rounded-2xl border border-[#ead4c6] bg-[#fff9f5] px-4 py-3 text-[#2b1f45] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm text-[#615676]">
                    Interests
                  </span>
                  <input
                    value={interestInput}
                    onChange={(event) => {
                      const value = event.target.value;
                      setInterestInput(value);
                      saveInterestPreferences(value);
                    }}
                    placeholder="music, gaming, fitness, travel"
                    className="w-full rounded-2xl border border-[#ead4c6] bg-[#fff9f5] px-4 py-3 text-[#2b1f45] outline-none placeholder:text-[#a192b3]"
                  />
                  <p className="mt-2 text-xs leading-6 text-[#7b7092]">
                    Add up to 8 interests. Shared interests softly boost who you
                    get matched with.
                  </p>
                  {selectedInterests.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedInterests.map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full border border-[#ffd8c2] bg-[#fff2e9] px-3 py-1 text-xs text-[#9a5f46]"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </label>
              </div>

              <div className="rounded-[2.2rem] border border-[#ffd4b5] bg-[#fff2e7] p-6">
                <div className="flex items-center gap-3 text-[#ff6b6b]">
                  <Crown className="h-5 w-5" />
                  <p className="text-sm uppercase tracking-[0.24em]">
                    Premium upgrade
                  </p>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-[#2b1f45]">
                  More video access, media sharing, advanced filters, and friends.
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#65597f]">
                  Free users keep unlimited text chat, but premium unlocks friend
                  adds and keeps video access going after the free limit. Payment
                  gateway wiring can be swapped in when you send it.
                </p>
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={loadingUpgrade || user.isPremium}
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-[#ff6b6b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f05a5a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {user.isPremium
                    ? "Premium active"
                    : loadingUpgrade
                      ? "Starting checkout..."
                      : "Upgrade to Premium"}
                </button>
              </div>

              <div className="rounded-[2.2rem] border border-[#ead6ca] bg-white/82 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-[#7d7297]">
                      Friends
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-[#2b1f45]">
                      Saved connections
                    </h3>
                  </div>
                  <span className="rounded-full border border-[#ecd9cd] px-3 py-1 text-xs text-[#6c617f]">
                    {user.isPremium ? "Premium" : "Locked"}
                  </span>
                </div>

                {!user.isPremium ? (
                  <div className="mt-5 rounded-[1.5rem] border border-[#eedcd0] bg-[#fff8f4] p-4 text-sm leading-7 text-[#665a7f]">
                    Premium members can add people they click with and see that
                    friend list here.
                  </div>
                ) : friends.length === 0 ? (
                  <div className="mt-5 rounded-[1.5rem] border border-dashed border-[#ead6ca] bg-[#fff8f4] p-4 text-sm leading-7 text-[#665a7f]">
                    Add a friend from the chat screen after a good match, and
                    they’ll show up here.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {friends.map((friendship) => (
                      <div
                        key={friendship.id}
                        className="flex items-center justify-between rounded-[1.4rem] border border-[#ecd8cb] bg-[#fffaf6] px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-[#2b1f45]">
                            {friendship.friend.displayName}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7c7195]">
                            {friendship.friend.gender === "UNSPECIFIED"
                              ? "Prefer not to say"
                              : friendship.friend.gender.toLowerCase()}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-2 text-sm text-[#ff6b6b]">
                          <UserRoundPlus className="h-4 w-4" />
                          Added
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notice ? (
                <div className="rounded-[1.5rem] border border-[#edd7cb] bg-white px-4 py-3 text-sm text-[#4a3b63]">
                  {notice}
                </div>
              ) : null}

              <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#7c7194]">
                <Link href="/terms" className="hover:text-[#2b1f45]">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-[#2b1f45]">
                  Privacy
                </Link>
                <Link href="/guidelines" className="hover:text-[#2b1f45]">
                  Guidelines
                </Link>
                <Link href="/safety" className="hover:text-[#2b1f45]">
                  Safety
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
