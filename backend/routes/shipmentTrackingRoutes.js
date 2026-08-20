import express from "express";
import { authorizeRoles, verifyToken } from "../middlelware/authMiddleware.js";

import {
    addTracking,
    getTracking,
    updateTracking
} from "../controllers/shipmentTrackingController.js";

const router = express.Router();
router.use(verifyToken, authorizeRoles("super_admin", "organization_admin"));

router.post("/", addTracking);

router.get("/shipment/:shipmentId", getTracking);

router.put("/:id", updateTracking);

export default router;
