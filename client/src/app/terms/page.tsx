import { PolicyPage } from "@/components/policy-page";

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms of Service"
      title="VibeMeet Terms of Service"
      intro="VibeMeet is a random chat platform for adults. By using it, you agree to interact responsibly, follow platform rules, and accept that chats are matched in real time with strangers or AI fallback when no user is available."
      sections={[
        {
          title: "Adult-only access",
          body: "VibeMeet is intended only for users aged 18 or older. By entering the app, you confirm you meet that requirement and understand the platform is built for adult conversations.",
        },
        {
          title: "User responsibility",
          body: "You are responsible for your own conduct, messages, media uploads, and use of the reporting tools. Harassment, exploitation, explicit illegal content, impersonation, or abusive behavior may result in moderation or account removal.",
        },
        {
          title: "Random matching",
          body: "Matches are created dynamically and may connect you to another user or an AI fallback companion if the queue is empty. We do not guarantee match availability, uninterrupted service, or premium feature uptime.",
        },
      ]}
    />
  );
}
