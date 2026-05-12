import { Router } from "express";
import {
  getCities,
  getCityDetails,
  getCityHistory
} from "../controllers/cityController.js";

const router = Router();

router.get("/", getCities);
router.get("/:id", getCityDetails);
router.get("/:id/history", getCityHistory);

export default router;
