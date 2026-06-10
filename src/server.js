import app from "./app.js";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { startFinanceScheduler } from "./modules/fees/finance.scheduler.js";
import { StudentFee } from "./modules/finance/fees/studentFee.model.js";
import { startBillingCron } from "./jobs/cron.js";


async function dropOldIndexSafely() {
  try {
    await StudentFee.collection.dropIndex(
      "schoolId_1_studentId_1_feeStructureId_1"
    );

    console.log("✅ Old index removed");
  } catch (err) {
    // Ignore ONLY if index doesn't exist
    if (err.codeName === "IndexNotFound") {
      console.log("ℹ️ Index already removed");
    } else {
      console.warn("⚠️ Index drop warning:", err.message);
    }
  }
}

async function startServer() {
  try {
    await mongoose.connect(env.MONGO_URI);

    console.log("✅ MongoDB connected");

    // ✅ run AFTER connection is stable
    await dropOldIndexSafely();
      startBillingCron();
    startFinanceScheduler();

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error.message);
    process.exit(1);
  }
}

startServer();