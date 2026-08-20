import express from "express";
import { verifyToken, authorizeRoles } from "../middlelware/authMiddleware.js";
import { getLiveTracking, updateLiveLocation } from "../controllers/liveTrackingController.js";

const router = express.Router();
router.use(verifyToken);
router.get("/", authorizeRoles("super_admin", "organization_admin", "driver"), getLiveTracking);
router.post("/:shipmentId/location", authorizeRoles("super_admin", "organization_admin", "driver"), updateLiveLocation);
export default router;