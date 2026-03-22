import { PolicyPage } from "@/components/policy-page";

export default function GuidelinesPage() {
  return (
    <PolicyPage
      eyebrow="Community Guidelines"
      title="VibeMeet Community Guidelines"
      intro="VibeMeet works best when people show up with basic respect, curiosity, and clear boundaries. Keep conversations consensual, avoid harassment, and treat other users like real people."
      sections={[
        {
          title: "Respect the person on the other side",
          body: "No hate speech, threats, coercion, stalking, or sexually aggressive behavior. If someone is not interested, move on. Use the next button instead of escalating the chat.",
        },
        {
          title: "Keep uploads safe",
          body: "Premium uploads are for optional sharing during chat, not for abuse. Do not send illegal, exploitative, or non-consensual content. Basic moderation flagging may block unsafe messages.",
        },
        {
          title: "Use the report tool honestly",
          body: "The report system exists to protect the community. Report harmful behavior with a clear reason so moderators or future safety tooling can respond accurately.",
        },
      ]}
    />
  );
}
