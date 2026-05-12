import cron from "node-cron";
import { env } from "../config/env.js";
import { refreshCitySnapshots } from "../services/insightsService.js";

export function startRefreshJob() {
  cron.schedule(env.refreshCron, async () => {
    console.log("Running scheduled refresh job");
    await refreshCitySnapshots();
  });
}
