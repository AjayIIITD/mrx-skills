import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function callAgent({ systemPrompt, userPrompt, temperature = 0.3 }) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature,
    response_format: { type: "json_object" }
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  try {
    return { parsed: JSON.parse(raw), raw, tokens: completion.usage?.total_tokens || 0 };
  } catch {
    // Try to extract JSON from markdown
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return { parsed: JSON.parse(jsonMatch[1]), raw, tokens: completion.usage?.total_tokens || 0 };
    return { parsed: {}, raw, tokens: completion.usage?.total_tokens || 0 };
  }
}
