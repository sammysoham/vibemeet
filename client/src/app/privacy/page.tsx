import { PolicyPage } from "@/components/policy-page";

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy Policy"
      title="VibeMeet Privacy Policy"
      intro="VibeMeet stores the minimum data needed to run accounts, random matching, subscriptions, and reporting. This includes account credentials, anonymous display names, gender selection, subscription status, reports, and basic operational logs."
      sections={[
        {
          title: "What we store",
          body: "We store account details you provide during signup or guest access, including display name, gender, premium status, and timestamps. Reports and subscription records are also stored in PostgreSQL to support safety and billing flows.",
        },
        {
          title: "How data is used",
          body: "Data is used to authenticate you, place you in the matchmaking queue, support premium features, enforce skip limits for free users, and process reports. AI fallback messages may be sent to OpenRouter if that feature is configured.",
        },
        {
          title: "Your choices",
          body: "You can leave a chat at any time, use guest mode, or avoid premium checkout entirely. The 18+ confirmation is stored locally in your browser so the age gate does not need to reappear each session.",
        },
      ]}
    />
  );
}
