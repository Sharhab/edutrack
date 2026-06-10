import mongoose from "mongoose";

export async function cleanupIndexes() {
  try {
    const db = mongoose.connection.db;

    const schools =
      db.collection("schools");

    const indexes =
      await schools.indexes();

    const brokenDomainIndex =
      indexes.find(
        (i) =>
          i.name === "domain_1" &&
          !i.partialFilterExpression
      );

    if (brokenDomainIndex) {
      console.log(
        "🧹 Removing broken domain index..."
      );

      await schools.dropIndex(
        "domain_1"
      );

      console.log(
        "✅ Broken domain index removed"
      );
    }
  } catch (error) {
    console.log(
      "⚠️ Cleanup skipped:",
      error.message
    );
  }
}