"use client";

import { useState, useSyncExternalStore } from "react";
import { ShieldCheck } from "lucide-react";
import { confirmAgeGate, hasConfirmedAge } from "@/lib/auth";

export function AgeGate() {
  const [dismissed, setDismissed] = useState(false);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isOpen = isClient && !dismissed && !hasConfirmedAge();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(255,244,236,0.76)] px-5 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[2rem] border border-[#edd6c9] bg-white/92 p-7 shadow-[0_30px_80px_rgba(240,151,104,0.16)]">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e6] text-[#ff6b6b]">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-semibold text-[#2b1f45]">
          This platform is intended for users aged 18 or older.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#64597e]">
          VibeMeet is for adults only. By continuing, you confirm that you are
          18+ and agree to use the platform responsibly.
        </p>
        <button
          type="button"
          onClick={() => {
            confirmAgeGate();
            setDismissed(true);
          }}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#ff6b6b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f05a5a]"
        >
          I am 18+
        </button>
      </div>
    </div>
  );
}
