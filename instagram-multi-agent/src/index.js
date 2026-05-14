import "dotenv/config";
import cron from "node-cron";
import { orchestrate } from "./orchestrator.js";
import { initFirebase } from "./services/firebase.js";

// ─── CONFIG ───────────────────────────────────────────
const ACCOUNT = {
  username: process.env.INSTAGRAM_USERNAME || "mrx.6539",
  niche: process.env.INSTAGRAM_NICHE || "lifestyle, college, aesthetic",
  followers: parseInt(process.env.ACCOUNT_FOLLOWERS || "57"),
  postsCount: parseInt(process.env.ACCOUNT_POSTS || "23"),
  bio: process.env.ACCOUNT_BIO || "IIITD'29"
};

const SCHEDULE = process.env.POST_SCHEDULE || "0 8 * * *"; // Daily 8 AM

// ─── MAIN ─────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  Instagram Multi-Agent System v1     ║");
  console.log("╠══════════════════════════════════════╣");
  console.log(`║  Account: @${ACCOUNT.username}           `);
  console.log(`║  Niche:   ${ACCOUNT.niche}     `);
  console.log(`║  Schedule: ${SCHEDULE}              `);
  console.log("╚══════════════════════════════════════╝");

  initFirebase();
  await orchestrate(ACCOUNT);
}

// ─── CRON SCHEDULER ───────────────────────────────────
const job = cron.schedule(SCHEDULE, () => {
  console.log(`\n⏰ Cron triggered at ${new Date().toISOString()}`);
  main().catch(err => console.error("❌ Cron job failed:", err.message));
});

console.log(`\n⏱ Cron scheduled: ${SCHEDULE} (${SCHEDULE === "0 8 * * *" ? "daily 8 AM" : "custom"})`);
console.log("   The system will run automatically.\n");
console.log("   Run 'npm run orchestrate' for a manual run.");
console.log("   Run 'npm run dev' for development mode.\n");

// ─── HANDLE MANUAL RUN ────────────────────────────────
const isManual = process.argv.includes("--now");
if (isManual) {
  main().catch(err => {
    console.error("❌ Manual run failed:", err);
    process.exit(1);
  });
}
