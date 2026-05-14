import { analyseAccount } from "./agents/analyser.js";
import { scoutTrends } from "./agents/trend-scout.js";
import { planContent } from "./agents/content-planner.js";
import { writeCaption } from "./agents/caption-writer.js";
import { publishPost } from "./agents/publisher.js";
import { saveAgentOutput, getPostHistory } from "./services/firebase.js";

/**
 * Orchestrator — runs the full agent pipeline:
 * ANALYSER → TREND_SCOUT → CONTENT_PLANNER → CAPTION_WRITER → PUBLISHER
 */
export async function orchestrate(accountContext, mediaUrls = {}) {
  const startTime = Date.now();
  console.log("\n🧠 ORCHESTRATOR STARTED");
  console.log(`   Account: ${accountContext.username} | Niche: ${accountContext.niche}`);

  // Step 1: Get post history for context
  const postHistory = await getPostHistory(5);

  // Step 2: ANALYSER — analyse past performance
  console.log("\n📊 → ANALYSER");
  const analysis = await analyseAccount({
    ...accountContext,
    postHistory
  });
  await saveAgentOutput("analyser", analysis);
  console.log(`   Top formats: ${analysis.topFormats?.join(", ") || "N/A"}`);
  console.log(`   Trend: ${analysis.engagementTrend || "N/A"}`);

  // Step 3: TREND SCOUT — research trends
  console.log("\n🔍 → TREND SCOUT");
  const trends = await scoutTrends(accountContext.niche);
  await saveAgentOutput("trend-scout", trends);
  console.log(`   Topics: ${trends.trendingTopics?.slice(0, 3).join(", ") || "N/A"}`);
  console.log(`   Audio: ${trends.viralAudio?.slice(0, 2).join(", ") || "N/A"}`);

  // Step 4: CONTENT PLANNER — decide what to post
  console.log("\n📅 → CONTENT PLANNER");
  const contentPlan = await planContent(analysis, trends, accountContext);
  await saveAgentOutput("content-planner", contentPlan);
  console.log(`   Type: ${contentPlan.postType} | Topic: ${contentPlan.topic}`);
  console.log(`   Hook: ${contentPlan.hook?.substring(0, 60)}`);

  // Step 5: CAPTION WRITER — write caption + hashtags
  console.log("\n✍️ → CAPTION WRITER");
  const captionResult = await writeCaption(contentPlan, analysis);
  await saveAgentOutput("caption-writer", captionResult);
  console.log(`   Caption: ${captionResult.caption?.substring(0, 50)}...`);
  console.log(`   Hashtags: ${captionResult.hashtags?.length || 0}`);

  // Step 6: PUBLISHER — post to Instagram
  console.log("\n🚀 → PUBLISHER");
  const publishResult = await publishPost(contentPlan, captionResult, mediaUrls);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ ORCHESTRATION COMPLETE (${elapsed}s)`);

  return {
    analysis,
    trends,
    contentPlan,
    captionResult,
    publishResult,
    elapsed
  };
}
