import express from "express";
import {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
} from "../controllers/dashboard.controller.js";

import { authorize } from "../middleware/authorize.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/summary", authorize("dashboard:read"), getSummary);
router.get("/categories", authorize("dashboard:read"), getCategoryBreakdown);
router.get("/trends", authorize("dashboard:read"), getMonthlyTrends);
router.get("/weekly", authorize("dashboard:read"), getWeeklyTrends);
router.get("/recent", authorize("dashboard:read"), getRecentActivity);

export default router;  