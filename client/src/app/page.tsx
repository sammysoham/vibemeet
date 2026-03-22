import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = {
  title: "Omegle-Style Random Chat With A Better Look",
  description:
    "VibeMeet is an Omegle-style random chat app with a cleaner design, text-only or live chat modes, premium upgrades, and AI fallback when nobody is available.",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "VibeMeet",
  url: "http://localhost:3000",
  description:
    "Anonymous Omegle-style random stranger chat with voice-plus-text mode, text-only mode, premium features, and AI fallback.",
  applicationCategory: "CommunicationApplication",
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AuthScreen />
    </>
  );
}
