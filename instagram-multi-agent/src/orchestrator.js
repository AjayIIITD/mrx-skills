import { analyseAccount } from "./agents/analyser.js";
import { scoutTrends } from "./agents/trend-scout.js";
import { planContent } from "./agents/content-planner.js";
import { writeCaption } from "./agents/caption-writer.js";
import { generateIdeas } from "./agents/idea-generator.js";
import { publishPost } from "./agents/publisher.js";
import { createReelMedia, createCarouselMedia, createStaticMedia } from "./services/media-creator.js";
import { saveAgentOutput, getPostHistory } from "./services/firebase.js";

/**
 * Orchestrator v2 — Full autonomous pipeline:
 * ANALYSE → TRENDS → IDEAS → PLAN → CANVA CREATE → CAPTION → PUBLISH
 * 
 * Set autonoumous=true to run full content generation loop
 */
export async function orchestrate(accountContext, options = {}) {
  const startTime = Date.now();
  const isAuto = options.autonomous !== false;
  
  console.log("\n🧠 ORCHESTRATOR v2 STARTED");
  console.log(`   Account: ${accountContext.username} | Niche: ${accountContext.niche}`);
  console.log(`   Mode: ${isAuto ? "🤖 FULL AUTONOMOUS" : "📝 Manual"}`);

  // Step 1: Get post history
  const postHistory = await getPostHistory(5);

  // Step 2: ANALYSER
  console.log("\n📊 → ANALYSER");
  const analysis = await analyseAccount({ ...accountContext, postHistory });
  await saveAgentOutput("analyser", analysis);
  console.log(`   Trend: ${analysis.engagementTrend || "N/A"}`);

  // Step 3: TREND SCOUT
  console.log("\n🔍 → TREND SCOUT");
  const trends = await scoutTrends(accountContext.niche);
  await saveAgentOutput("trend-scout", trends);
  console.log(`   Topics: ${trends.trendingTopics?.slice(0, 3).join(", ") || "N/A"}`);

  // Step 4: CONTENT PLANNER
  console.log("\n📅 → CONTENT PLANNER");
  const contentPlan = await planContent(analysis, trends, accountContext);
  await saveAgentOutput("content-planner", contentPlan);
  console.log(`   Type: ${contentPlan.postType} | Topic: ${contentPlan.topic}`);

  // Step 5: CANVA MEDIA CREATION (autonomous mode only)
  let mediaUrls = options.mediaUrls || {};
  
  if (isAuto && !options.mediaUrls) {
    console.log("\n🎨 → CANVA MEDIA CREATOR");
    
    try {
      switch (contentPlan.postType) {
        case "reel":
          mediaUrls.video = await createReelMedia(contentPlan, accountContext);
          break;
        case "carousel":
          mediaUrls.images = await createCarouselMedia(contentPlan, accountContext);
          break;
        default:
          mediaUrls.image = await createStaticMedia(contentPlan, accountContext);
      }
      console.log(`   Media: ${Object.keys(mediaUrls).length > 0 ? "✅ Created" : "⚠️ Skipped (will simulate)"}`);
    } catch (err) {
      console.warn(`   ⚠️ Canva creation failed: ${err.message} (will simulate post)`);
    }
  }

  // Step 6: CAPTION WRITER
  console.log("\n✍️ → CAPTION WRITER");
  const captionResult = await writeCaption(contentPlan, analysis);
  await saveAgentOutput("caption-writer", captionResult);
  console.log(`   Hashtags: ${captionResult.hashtags?.length || 0}`);

  // Step 7: PUBLISHER
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
    mediaUrls,
    elapsed
  };
}
