import cron from "node-cron";
import { runBillingExpiryJob } from "./billingExpiry.job.js";

export function startBillingCron() {
  cron.schedule("0 0 * * *", async () => {
    console.log("🕛 Running billing expiry job...");
    await runBillingExpiryJob();
  });
}