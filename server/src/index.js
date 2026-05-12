import cors from "cors";
import express from "express";
import morgan from "morgan";
import { connectDatabase } from "./config/db.js";
import { assertRequiredEnv, env } from "./config/env.js";
import { citySeeds } from "./data/cities.js";
import { startRefreshJob } from "./jobs/refreshJob.js";
import { City } from "./models/City.js";
import routes from "./routes/index.js";
import { hydrateCityMetadata, refreshCitySnapshots } from "./services/insightsService.js";

const app = express();

app.use(
  cors({
    origin: env.clientOrigin
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", routes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message: "Something went wrong",
    error: error.message
  });
});

async function bootstrap() {
  assertRequiredEnv();
  await connectDatabase();

  for (const city of citySeeds) {
    await City.updateOne({ name: city.name }, { $setOnInsert: city }, { upsert: true });
  }

  try {
    await hydrateCityMetadata();
    await refreshCitySnapshots();
  } catch (error) {
    console.warn(`Initial refresh skipped: ${error.message}`);
  }

  startRefreshJob();

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Bootstrap failed", error);
  process.exit(1);
});
