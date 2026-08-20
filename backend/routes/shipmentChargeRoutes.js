import express from "express";
import { authorizeRoles, verifyToken } from "../middlelware/authMiddleware.js";

import {
    saveCharges,
    getCharges,
    updateCharges
} from "../controllers/shipmentChargeController.js";

const router = express.Router();
router.use(verifyToken, authorizeRoles("super_admin", "organization_admin"));

router.post("/", saveCharges);

router.get("/shipment/:shipmentId", getCharges);

router.put("/:shipmentId", updateCharges);

export default router;
