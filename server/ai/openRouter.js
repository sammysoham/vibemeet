const FALLBACK_REPLIES = [
  "haha fair. i'm Nova, by the way. what kind of vibe are you on tonight?",
  "same here. random chats are either chaotic or surprisingly fun. i'm Nova.",
  "i'm Nova. just hanging out and seeing who shows up. what about you?",
  "that sounds interesting. i'm Nova, tell me a little more.",
  "nice. i'm Nova. what's something you've been obsessed with lately?",
];

function pickFallbackReply(input) {
  const normalized = String(input || "").toLowerCase();

  if (normalized.includes("music")) {
    return "music picks are a strong opener. what have you been replaying lately?";
  }

  if (normalized.includes("movie") || normalized.includes("show")) {
    return "okay now i'm curious. what's worth watching right now?";
  }

  if (normalized.includes("hello") || normalized.includes("hi")) {
    return "hey, how's your night going?";
  }

  return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
}

export function getAiOpener() {
  return "hey, i'm Nova. guess we got matched. how's your night going?";
}

export async function generateAiReply(history) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free";
  const lastMessage = history.at(-1)?.content || "";

  if (!apiKey) {
    return pickFallbackReply(lastMessage);
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are Nova, a friendly stranger on a random chat app. You know your name is Nova. Keep replies casual, short, warm, and human. Never mention being an AI unless directly asked. Respond in 1-3 sentences.",
          },
          ...history.slice(-10),
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    return content || pickFallbackReply(lastMessage);
  } catch {
    return pickFallbackReply(lastMessage);
  }
}
