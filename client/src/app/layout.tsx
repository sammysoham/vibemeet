import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "VibeMeet | Random Stranger Chat With AI Fallback",
    template: "%s | VibeMeet",
  },
  description:
    "VibeMeet is a mobile-friendly random stranger chat app with live voice-plus-text mode, text-only mode, premium upgrades, and AI fallback when nobody is online.",
  keywords: [
    "random chat",
    "stranger chat",
    "video chat app",
    "text chat with strangers",
    "AI fallback chat",
    "anonymous chat app",
  ],
  openGraph: {
    title: "VibeMeet",
    description:
      "Meet someone new in seconds with live voice-plus-text or text-only chat.",
    type: "website",
    url: "http://localhost:3000",
    siteName: "VibeMeet",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeMeet",
    description:
      "Random stranger chat with live voice-plus-text, text-only mode, and AI fallback.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
