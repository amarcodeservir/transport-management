import express from "express";
import { verifyToken, authorizeRoles } from "../middlelware/authMiddleware.js";
import { getReportSummary } from "../controllers/reportController.js";
const router = express.Router();
router.use(verifyToken);
router.get("/summary", authorizeRoles("super_admin", "organization_admin"), getReportSummary);
export default router;