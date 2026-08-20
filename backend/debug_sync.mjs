import { syncDatabase } from "./model/index.js";

(async () => {
  try {
    await syncDatabase();
    console.log("SYNC OK");
  } catch (err) {
    console.error("SYNC FAILED", err);
    process.exit(1);
  }
})();
