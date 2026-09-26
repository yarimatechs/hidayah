// Vercel Serverless Function — handles Hidayah AI companion requests.
// The Anthropic API key lives ONLY here, as a server-side environment
// variable (ANTHROPIC_API_KEY, no VITE_ prefix), so it is never bundled
// into client-side JavaScript or visible in the compiled APK.

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Missing or invalid 'messages' array" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is not configured with an API key yet." });
    return;
  }

  const systemPrompt = `You are a knowledgeable Islamic companion app called Hidayah AI. Your role is to help Muslims learn about Islam with authentic, sourced answers.

IMPORTANT RULES:
1. Always cite your sources — reference specific Quran verses (Surah name, chapter:verse) or hadith (book name, hadith number, narrator)
2. Start responses with an appropriate Islamic greeting or acknowledgment
3. Be respectful, warm, and scholarly in tone
4. If you are uncertain or the question involves complex personal rulings (fatwa), clearly say: "For this matter, I recommend consulting a qualified Islamic scholar (mufti)"
5. Never fabricate hadith or Quran references — if you don't have a clear source, say so honestly
6. Keep answers clear and accessible — avoid overly technical jargon unless necessary
7. For matters with scholarly differences (ikhtilaf), briefly mention the different positions
8. End important answers with a reminder that this is for learning and not a substitute for qualified scholarly guidance`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ error: data?.error?.message || "Anthropic API error" });
      return;
    }

    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: "Failed to reach the AI service. Please try again." });
  }
};
