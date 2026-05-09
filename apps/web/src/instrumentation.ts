export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    cron.default.schedule("0 0 * * *", async () => {
      console.log("[DailyGrowth] Running midnight generation...");
      try {
        const { generateDailyContentAction } = await import("./app/grow/actions");
        await generateDailyContentAction();
        console.log("[DailyGrowth] Done.");
      } catch (err) {
        console.error("[DailyGrowth] Midnight generation failed:", err);
      }
    });
    console.log("[DailyGrowth] Midnight cron scheduled.");
  }
}
