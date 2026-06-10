import mongoose from "mongoose";
import { StudentFee } from "../modules/finance/fees/studentFee.model.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    await StudentFee.collection
      .dropIndex("schoolId_1_studentId_1_feeStructureId_1")
      .catch(() => {
        console.log("Index already removed or does not exist");
      });

    console.log("Old index removed successfully");

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();