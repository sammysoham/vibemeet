import { PolicyPage } from "@/components/policy-page";

export default function SafetyPage() {
  return (
    <PolicyPage
      eyebrow="Safety Policy"
      title="VibeMeet Safety Policy"
      intro="VibeMeet includes an adult-only gate, rate limiting, report capture, and basic moderation flagging to make random chat safer without overcomplicating the product."
      sections={[
        {
          title: "18+ requirement",
          body: "The platform is designed only for adults. Users must confirm that they are 18+ before entering the app. This confirmation is stored locally in the browser for convenience.",
        },
        {
          title: "Reporting and moderation",
          body: "Users can report harmful behavior during a chat. The backend also rate limits API requests and blocks a small set of obviously unsafe flagged terms in chat messages.",
        },
        {
          title: "Safer random chat habits",
          body: "Do not share personal addresses, financial details, or anything you would not want a stranger to know. If a chat feels wrong, end it immediately and send a report.",
        },
      ]}
    />
  );
}
