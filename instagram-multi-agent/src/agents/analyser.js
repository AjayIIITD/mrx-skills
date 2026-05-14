import { callAgent } from "../services/groq.js";
import { AGENT_PROMPTS } from "../config/prompts.js";

export async function analyseAccount(accountData) {
  const userPrompt = `Analyse this Instagram account data and suggest improvements:
\`\`\`json
${JSON.stringify(accountData, null, 2)}
\`\`\``;

  const result = await callAgent({
    systemPrompt: AGENT_PROMPTS.ANALYSER,
    userPrompt,
    temperature: 0.2
  });

  return result.parsed;
}
