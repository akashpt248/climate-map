import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI || "",
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY || "",
  openAqApiKey: process.env.OPENAQ_API_KEY || "",
  geodbApiKey: process.env.GEODB_API_KEY || "",
  geodbApiHost: process.env.GEODB_API_HOST || "wft-geo-db.p.rapidapi.com",
  snapshotRetentionDays: Number(process.env.SNAPSHOT_RETENTION_DAYS || 15),
  refreshCron: process.env.REFRESH_CRON || "*/30 * * * *"
};

export function assertRequiredEnv() {
  const missing = [];

  if (!env.mongodbUri) missing.push("MONGODB_URI");
  if (!env.openWeatherApiKey) missing.push("OPENWEATHER_API_KEY");
  if (!env.openAqApiKey) missing.push("OPENAQ_API_KEY");
  if (!env.geodbApiKey) missing.push("GEODB_API_KEY");

  if (missing.length) {
    console.warn(
      `Missing environment variables: ${missing.join(
        ", "
      )}. The server can boot, but live refresh calls will fail until these are added.`
    );
  }
}
