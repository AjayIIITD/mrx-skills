import { callAgent } from "../services/groq.js";
import { AGENT_PROMPTS } from "../config/prompts.js";

export async function writeCaption(contentPlan, analysis) {
  const userPrompt = `Write an optimized Instagram caption for this post:

POST PLAN:
\`\`\`json
${JSON.stringify(contentPlan, null, 2)}
\`\`\`

PERFORMANCE CONTEXT:
\`\`\`json
${JSON.stringify(analysis, null, 2)}
\`\`\`

Write: a scroll-stopping caption, relevant hashtags (12-15 mix of sizes), and a specific CTA.`;

  const result = await callAgent({
    systemPrompt: AGENT_PROMPTS.CAPTION_WRITER,
    userPrompt,
    temperature: 0.4
  });

  return result.parsed;
}
