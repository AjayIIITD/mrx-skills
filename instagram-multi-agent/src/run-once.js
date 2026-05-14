#!/usr/bin/env node
/**
 * One-shot orchestration run (without cron).
 * Usage: node src/run-once.js
 */
import "dotenv/config";
import { orchestrate } from "./orchestrator.js";
import { initFirebase } from "./services/firebase.js";

const ACCOUNT = {
  username: process.env.INSTAGRAM_USERNAME || "mrx.6539",
  niche: process.env.INSTAGRAM_NICHE || "lifestyle, college, aesthetic",
  followers: parseInt(process.env.ACCOUNT_FOLLOWERS || "57"),
  postsCount: parseInt(process.env.ACCOUNT_POSTS || "23"),
  bio: process.env.ACCOUNT_BIO || "IIITD'29"
};

initFirebase();

orchestrate(ACCOUNT)
  .then(result => {
    console.log("\n📋 Orchestration Result:");
    console.log(`   Post: ${result.contentPlan?.postType} — ${result.contentPlan?.topic}`);
    console.log(`   Time: ${result.elapsed}s`);
    console.log(`   Published: ${result.publishResult?.id ? "✅ Yes" : "⚠️ Simulated (no API keys)"}`);
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  });
