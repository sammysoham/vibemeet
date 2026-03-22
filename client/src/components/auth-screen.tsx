"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  AudioWaveform,
  HeartHandshake,
  LockKeyhole,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Waves,
} from "lucide-react";
import { AgeGate } from "@/components/age-gate";
import { api } from "@/lib/api";
import {
  getAuthSession,
  saveAuthSession,
  saveChatModePreference,
} from "@/lib/auth";
import type { ChatModePreference, Gender } from "@/types";

type AuthMode = "signup" | "login" | "guest";

const modeCopy: Record<AuthMode, { title: string; button: string }> = {
  signup: {
    title: "Make your anonymous profile and jump in.",
    button: "Create account",
  },
  login: {
    title: "Jump back into the next great random chat.",
    button: "Log in",
  },
  guest: {
    title: "Start fast, stay anonymous, keep it light.",
    button: "Continue as guest",
  },
};

const chatModeOptions: {
  value: ChatModePreference;
  label: string;
  summary: string;
  icon: typeof Waves;
}[] = [
  {
    value: "VOICE_TEXT",
    label: "Voice + text",
    summary: "Default. Start with the full live experience when a match is ready.",
    icon: AudioWaveform,
  },
  {
    value: "TEXT_ONLY",
    label: "Only text",
    summary: "Keep it low-pressure and text-first from the beginning.",
    icon: MessageSquareMore,
  },
];

const attractionSections = [
  {
    eyebrow: "Why people miss Omegle-style chat",
    title: "Random conversations are still exciting when they feel light, fast, and a little unpredictable.",
    body:
      "Old-school stranger chat apps worked because they dropped you into something immediate. VibeMeet keeps that instant spark, but gives it a cleaner visual style, better mobile behavior, AI fallback when the room is quiet, and a clearer safety baseline.",
  },
  {
    eyebrow: "What makes VibeMeet different",
    title: "It feels more like a modern social product and less like a sketchy leftover website.",
    body:
      "You can start with voice plus text or a text-only vibe, keep an anonymous display name, use guest mode, and move quickly without the interface fighting you. Premium adds richer sharing and friend saves, but the core experience stays simple and fast.",
  },
  {
    eyebrow: "Built for attraction",
    title: "The landing page, dashboard, and live chat are designed to feel playful, warm, and easy to try.",
    body:
      "That means brighter colors, clearer actions, cleaner mobile spacing, and more context up front about how the app works. Instead of hiding the story, VibeMeet tells you what it is, who it is for, and why it is more enjoyable to use.",
  },
];

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<Gender>("UNSPECIFIED");
  const [chatMode, setChatMode] = useState<ChatModePreference>("VOICE_TEXT");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAuthSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const copy = useMemo(() => modeCopy[mode], [mode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response =
        mode === "signup"
          ? await api.signup({
              email,
              password,
              displayName,
              gender,
              acceptedTerms,
            })
          : mode === "login"
            ? await api.login({ email, password, acceptedTerms })
            : await api.guest({ displayName, gender, acceptedTerms });

      saveAuthSession(response);
      saveChatModePreference(chatMode);
      router.push("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to continue right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AgeGate />
      <div className="relative min-h-screen overflow-hidden bg-[#fff7ef]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,115,115,0.24),_transparent_22%),radial-gradient(circle_at_88%_12%,_rgba(86,194,255,0.24),_transparent_20%),radial-gradient(circle_at_20%_75%,_rgba(255,194,92,0.18),_transparent_16%)]" />

        <main className="relative mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
          <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="overflow-hidden rounded-[2.8rem] border border-[#f2cfbb] bg-[linear-gradient(145deg,#fff5eb_0%,#fffef9_48%,#ffe5d1_100%)] p-7 shadow-[0_30px_80px_rgba(247,144,94,0.18)] sm:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f3bfa3] bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#d65f5f]">
                <Sparkles className="h-3.5 w-3.5" />
                VibeMeet
              </div>

              <h1 className="mt-7 max-w-3xl text-5xl font-semibold tracking-[-0.08em] text-[#2b1f45] sm:text-6xl lg:text-7xl">
                The fun random chat app for people who miss the spontaneity of Omegle, but want something cleaner.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5c5176]">
                VibeMeet is a stranger chat platform built for fast matches,
                bright energy, and a smoother mobile feel. Choose voice plus
                text or text-only, stay anonymous, and keep chatting even when
                the queue is quiet with Nova as an AI fallback.
              </p>

              <div className="mt-9 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.8rem] border border-[#f4d6c4] bg-white/75 p-5">
                  <AudioWaveform className="h-5 w-5 text-[#ff6b6b]" />
                  <p className="mt-4 text-lg font-semibold text-[#2b1f45]">
                    Voice or text-first
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6d6287]">
                    Start with live energy or keep it text-only from the jump.
                  </p>
                </div>
                <div className="rounded-[1.8rem] border border-[#f4d6c4] bg-white/75 p-5">
                  <ShieldCheck className="h-5 w-5 text-[#ff8a4c]" />
                  <p className="mt-4 text-lg font-semibold text-[#2b1f45]">
                    Cleaner than old random chat
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6d6287]">
                    Adult-only entry, reporting, better layout, and clearer rules.
                  </p>
                </div>
                <div className="rounded-[1.8rem] border border-[#f4d6c4] bg-white/75 p-5">
                  <HeartHandshake className="h-5 w-5 text-[#4aa9ff]" />
                  <p className="mt-4 text-lg font-semibold text-[#2b1f45]">
                    Better staying power
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6d6287]">
                    Friends, premium upgrades, and AI fallback make it feel more alive.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2.8rem] border border-[#efcfbf] bg-white/88 p-6 shadow-[0_28px_80px_rgba(230,139,101,0.16)] backdrop-blur-xl sm:p-8">
              <div className="flex gap-2 rounded-full border border-[#f1d8ca] bg-[#fff4ed] p-1">
                {(["signup", "login", "guest"] as AuthMode[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setMode(value);
                      setError("");
                    }}
                    className={`flex-1 rounded-full px-3 py-2 text-sm font-medium capitalize transition ${
                      mode === value
                        ? "bg-[#ff6b6b] text-white"
                        : "text-[#6b617f] hover:bg-white"
                    }`}
                  >
                    {value === "guest" ? "Guest" : value}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-sm uppercase tracking-[0.24em] text-[#ff6b6b]/70">
                  Start here
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#2b1f45]">
                  {copy.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#6b617f]">
                  Pick an anonymous identity, choose how you want to chat, and enter the queue.
                </p>
              </div>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                {mode !== "guest" ? (
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm text-[#594f70]">
                      <LockKeyhole className="h-4 w-4" />
                      Email
                    </span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-2xl border border-[#ead4c7] bg-[#fffaf6] px-4 py-3 text-[#2b1f45] outline-none transition placeholder:text-[#a196b5] focus:border-[#ff8a4c]"
                      placeholder="you@example.com"
                    />
                  </label>
                ) : null}

                {mode !== "login" ? (
                  <>
                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm text-[#594f70]">
                        <UserRound className="h-4 w-4" />
                        Anonymous display name
                      </span>
                      <input
                        required
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        className="w-full rounded-2xl border border-[#ead4c7] bg-[#fffaf6] px-4 py-3 text-[#2b1f45] outline-none transition placeholder:text-[#a196b5] focus:border-[#ff8a4c]"
                        placeholder="NightOwl"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 text-sm text-[#594f70]">Gender</span>
                      <select
                        value={gender}
                        onChange={(event) => setGender(event.target.value as Gender)}
                        className="w-full rounded-2xl border border-[#ead4c7] bg-[#fffaf6] px-4 py-3 text-[#2b1f45] outline-none transition focus:border-[#ff8a4c]"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="UNSPECIFIED">Prefer not to say</option>
                      </select>
                    </label>
                  </>
                ) : null}

                {mode !== "guest" ? (
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm text-[#594f70]">
                      <LockKeyhole className="h-4 w-4" />
                      Password
                    </span>
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-2xl border border-[#ead4c7] bg-[#fffaf6] px-4 py-3 text-[#2b1f45] outline-none transition placeholder:text-[#a196b5] focus:border-[#ff8a4c]"
                      placeholder="At least 6 characters"
                    />
                  </label>
                ) : null}

                <div className="rounded-[1.9rem] border border-[#f0d8cb] bg-[#fff6f0] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-[#4d4465]">
                    <Waves className="h-4 w-4 text-[#ff6b6b]" />
                    Pick your starting mode
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {chatModeOptions.map((option) => {
                      const Icon = option.icon;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setChatMode(option.value)}
                          className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                            chatMode === option.value
                              ? "border-[#ff8a4c] bg-white"
                              : "border-[#edd6c8] bg-[#fffaf6] hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-[#2b1f45]">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{option.label}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#6d6287]">
                            {option.summary}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <label className="flex items-start gap-3 rounded-[1.5rem] border border-[#ead4c7] bg-[#fffaf6] px-4 py-3">
                  <input
                    required
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#d7bfd4] bg-transparent text-[#ff6b6b]"
                  />
                  <span className="text-sm leading-6 text-[#5d5476]">
                    I accept the{" "}
                    <Link
                      href="/terms"
                      className="text-[#2b1f45] underline decoration-[#dcb8a8]"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-[#2b1f45] underline decoration-[#dcb8a8]"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || !acceptedTerms}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff6b6b] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#f05a5a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Working..." : copy.button}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#7a6f92]">
                <Link href="/terms" className="hover:text-[#2b1f45]">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="hover:text-[#2b1f45]">
                  Privacy Policy
                </Link>
                <Link href="/guidelines" className="hover:text-[#2b1f45]">
                  Community Guidelines
                </Link>
                <Link href="/safety" className="hover:text-[#2b1f45]">
                  Safety Policy
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2.4rem] border border-[#efd6c6] bg-white/80 p-7 shadow-[0_24px_70px_rgba(238,152,104,0.14)]">
              <p className="text-sm uppercase tracking-[0.24em] text-[#ff6b6b]/70">
                About this app
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#2b1f45]">
                VibeMeet is for the person who wants the thrill of random chat without the stale old-web feeling.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#62567b]">
                Think of it as an Omegle-inspired idea rebuilt for a lighter,
                prettier, more mobile-friendly experience. It is still fast and
                anonymous, but the product explains itself better, looks better,
                and gives you more control over how you show up.
              </p>
            </div>

            <div className="grid gap-5">
              {attractionSections.map((section, index) => (
                <article
                  key={section.title}
                  className={`rounded-[2.2rem] border p-6 shadow-[0_22px_60px_rgba(239,150,105,0.12)] ${
                    index === 1
                      ? "border-[#ffcfb0] bg-[#fff2e8]"
                      : "border-[#edd8ca] bg-white/85"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-[#ff6b6b]/70">
                    {section.eyebrow}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#2b1f45]">
                    {section.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[#62567b]">
                    {section.body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-[#f1d8ca] bg-white/82 p-6">
              <Star className="h-5 w-5 text-[#ff8a4c]" />
              <h3 className="mt-4 text-2xl font-semibold text-[#2b1f45]">
                Attraction copy that actually explains the value
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#65597f]">
                The home page now talks about what people want from random chat:
                speed, curiosity, anonymity, a better mobile feel, and less of
                the weird neglected energy that old platforms picked up.
              </p>
            </div>
            <div className="rounded-[2rem] border border-[#f1d8ca] bg-white/82 p-6">
              <Sparkles className="h-5 w-5 text-[#4aa9ff]" />
              <h3 className="mt-4 text-2xl font-semibold text-[#2b1f45]">
                Better than “just another Omegle clone”
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#65597f]">
                VibeMeet is not trying to be a frozen copy of an older random
                chat site. It keeps the instant match energy, but adds clearer
                onboarding, stronger UI, AI fallback, friend saves, and a cleaner
                premium path.
              </p>
            </div>
            <div className="rounded-[2rem] border border-[#f1d8ca] bg-white/82 p-6">
              <MessageSquareMore className="h-5 w-5 text-[#ff6b6b]" />
              <h3 className="mt-4 text-2xl font-semibold text-[#2b1f45]">
                Easy to try, easy to understand
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#65597f]">
                People can immediately see they can use voice plus text, text-only
                chat, guest mode, premium media, and AI fallback. That extra
                clarity makes the app feel more trustworthy and easier to test.
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
