import { callAgent } from "../services/groq.js";
import { AGENT_PROMPTS } from "../config/prompts.js";

export async function planContent(analysis, trends, accountData) {
  const userPrompt = `Given the following data, plan the next Instagram post:

ACCOUNT DATA:
\`\`\`json
${JSON.stringify(accountData, null, 2)}
\`\`\`

PERFORMANCE ANALYSIS:
\`\`\`json
${JSON.stringify(analysis, null, 2)}
\`\`\`

TRENDS:
\`\`\`json
${JSON.stringify(trends, null, 2)}
\`\`\`

Decide: post type, topic, exact hook, structure, and best posting time.`;

  const result = await callAgent({
    systemPrompt: AGENT_PROMPTS.CONTENT_PLANNER,
    userPrompt,
    temperature: 0.3
  });

  return result.parsed;
}
