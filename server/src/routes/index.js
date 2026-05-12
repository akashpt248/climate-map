import { Router } from "express";
import cityRoutes from "./cityRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

router.use("/cities", cityRoutes);

export default router;
