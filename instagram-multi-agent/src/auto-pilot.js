#!/usr/bin/env node
/**
 * Auto-Pilot Mode — Runs the full autonomous Instagram growth system.
 * 
 * Every cycle:
 * 1. Generates fresh content ideas
 * 2. Creates media (via Canva MCP)
 * 3. Posts to Instagram
 * 4. Logs everything
 * 5. Sleeps until next cycle
 * 
 * Usage:
 *   node src/auto-pilot.js              # Runs once immediately
 *   node src/auto-pilot.js --daemon     # Runs on cron schedule
 *   node src/auto-pilot.js --dry-run    # Simulates without posting
 */
import "dotenv/config";
import { orchestrate } from "./orchestrator.js";
import { generateIdeas } from "./agents/idea-generator.js";
import { initFirebase } from "./services/firebase.js";

const ACCOUNT = {
  username: process.env.INSTAGRAM_USERNAME || "chameleon.5564070",
  niche: process.env.INSTAGRAM_NICHE || "lifestyle, aesthetic",
  followers: parseInt(process.env.ACCOUNT_FOLLOWERS || "57"),
  postsCount: parseInt(process.env.ACCOUNT_POSTS || "23"),
  bio: process.env.ACCOUNT_BIO || ""
};

const isDaemon = process.argv.includes("--daemon");
const isDryRun = process.argv.includes("--dry-run");
const SCHEDULE_HOURS = parseInt(process.env.POST_INTERVAL_HOURS || "24");

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runCycle(cycleNumber) {
  console.log("\n" + "=".repeat(50));
  console.log(`🌙 AUTO-PILOT CYCLE #${cycleNumber}`);
  console.log(`   Account: @${ACCOUNT.username}`);
  console.log(`   Niche: ${ACCOUNT.niche}`);
  console.log(`   Time: ${new Date().toLocaleString()}`);
  console.log("=".repeat(50));

  // Generate fresh content ideas
  console.log("\n💡 → IDEA GENERATOR");
  const ideas = await generateIdeas(ACCOUNT);
  await logActivity(`Generated ${ideas.length} content ideas`);
  console.log(`   Top idea: ${ideas[0]?.topic || "N/A"}`);

  // Pick the best idea and run the full pipeline
  console.log(`\n🎯 Selected: "${ideas[0]?.topic || ACCOUNT.niche}"`);
  
  const result = await orchestrate(ACCOUNT, {
    autonomous: !isDryRun,
    mediaUrls: isDryRun ? {} : undefined
  });

  // Log results
  const logEntry = {
    cycle: cycleNumber,
    timestamp: new Date().toISOString(),
    topic: result.contentPlan?.topic,
    postType: result.contentPlan?.postType,
    hook: result.contentPlan?.hook,
    published: result.publishResult?.simulated ? false : true,
    elapsed: result.elapsed
  };
  
  await logActivity(JSON.stringify(logEntry));
  
  console.log(`\n📊 Cycle #${cycleNumber} complete in ${result.elapsed}s`);
  return result;
}

async function logActivity(message) {
  const firestore = initFirebase();
  try {
    await firestore.collection("auto_pilot_log").add({
      message,
      timestamp: new Date().toISOString()
    });
  } catch {
    // In-memory fallback
  }
  return message;
}

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  Instagram Auto-Pilot System v2      ║");
  console.log("╠══════════════════════════════════════╣");
  console.log(`║  Account: @${ACCOUNT.username}                `);
  console.log(`║  Mode:    ${isDryRun ? "DRY RUN" : isDaemon ? `Every ${SCHEDULE_HOURS}h` : "Single Run"}`);
  console.log("╚══════════════════════════════════════╝");

  initFirebase();
  
  if (isDaemon) {
    // Daemon mode — runs forever on schedule
    let cycle = 1;
    while (true) {
      try {
        await runCycle(cycle++);
      } catch (err) {
        console.error(`❌ Cycle failed: ${err.message}`);
        await logActivity(`ERROR: ${err.message}`);
      }
      
      console.log(`\n⏰ Sleeping for ${SCHEDULE_HOURS} hours...`);
      console.log(`   Next run: ${new Date(Date.now() + SCHEDULE_HOURS * 3600000).toLocaleString()}`);
      await sleep(SCHEDULE_HOURS * 3600000);
    }
  } else {
    // Single run mode
    await runCycle(1);
    console.log("\n✅ Auto-pilot run complete.");
    console.log("   Use --daemon for continuous mode.");
    console.log("   Use --dry-run to simulate without posting.\n");
  }
}

main().catch(err => {
  console.error("❌ Auto-pilot failed:", err.message);
  process.exit(1);
});
