import { callAgent } from "../services/groq.js";
import { AGENT_PROMPTS } from "../config/prompts.js";

export async function scoutTrends(niche) {
  const userPrompt = `Research current Instagram trends for the niche: "${niche}".
Return trending topics, viral audio suggestions, popular formats, hashtag ideas, and content gaps.`;

  const result = await callAgent({
    systemPrompt: AGENT_PROMPTS.TREND_SCOUT,
    userPrompt,
    temperature: 0.4
  });

  return result.parsed;
}
