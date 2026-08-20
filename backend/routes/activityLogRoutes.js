import express from "express";
import { authorizeRoles, verifyToken } from "../middlelware/authMiddleware.js";
import { getActivityLogs } from "../controllers/activityLogController.js";

const router = express.Router();
router.use(verifyToken, authorizeRoles("super_admin"));
router.get("/", getActivityLogs);
export default router;
