import { callAgent } from "../services/groq.js";

export async function generateIdeas(accountContext, postHistory = []) {
  const systemPrompt = `You are an Instagram content strategist.
Your job is to generate 3 fresh, creative content ideas for an Instagram account.
Each idea must be specific, trend-aware, and designed for maximum engagement (saves, shares, comments).

For each idea, provide:
- format: "reel" | "carousel" | "static"
- topic: clear topic title
- hook: the exact first 2 seconds (for reel) or first line (for carousel)
- whyItWorks: psychological reason this will perform well
- visualDescription: exact visual concept for Canva designer to create

Return JSON array of 3 idea objects.`;

  const userPrompt = `Generate 3 content ideas for this Instagram account:

ACCOUNT:
- Username: ${accountContext.username}
- Niche: ${accountContext.niche}
- Followers: ${accountContext.followers}
- Bio: ${accountContext.bio || "N/A"}

${postHistory.length > 0 ? `RECENT POSTS (avoid repeating these topics):\n${postHistory.slice(0,5).map(p => `- ${p.topic || p.caption?.substring(0,50)}`).join('\n')}` : 'No recent posts.'}

Requirements:
1. Ideas must be tailored to ${accountContext.niche} niche
2. At least 1 reel idea, 1 carousel idea
3. Hooks must be scroll-stopping
4. Visual descriptions must be detailed enough for a designer to execute
5. Focus on saves and shares (not just likes)`;

  const result = await callAgent({
    systemPrompt,
    userPrompt,
    temperature: 0.7
  });

  const ideas = result.parsed;
  return Array.isArray(ideas) ? ideas : (ideas.ideas || [ideas]);
}
