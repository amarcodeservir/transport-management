import express from "express";
import { authorizeRoles, verifyToken } from "../middlelware/authMiddleware.js";

import {
    createParty,
    getShipmentParties,
    updateParty,
    deleteParty
} from "../controllers/shipmentPartyController.js";

const router = express.Router();
router.use(verifyToken, authorizeRoles("super_admin", "organization_admin"));

router.post("/", createParty);

router.get("/shipment/:shipmentId", getShipmentParties);

router.put("/:id", updateParty);

router.delete("/:id", deleteParty);

export default router;
