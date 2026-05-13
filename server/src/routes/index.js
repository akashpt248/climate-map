import { Router } from "express";
import { env } from "../config/env.js";
import { describeCronExpression } from "../utils/cronHint.js";
import cityRoutes from "./cityRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

router.get("/meta", (req, res) => {
  res.json({
    data: {
      snapshotRefreshCron: env.refreshCron,
      snapshotRefreshHint: describeCronExpression(env.refreshCron)
    }
  });
});

router.use("/cities", cityRoutes);

export default router;
