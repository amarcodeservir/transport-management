import express from "express";
import { authorizeRoles, verifyToken } from "../middlelware/authMiddleware.js";

import {
    createShipment,
    getAllShipments,
    getShipmentById,
    updateShipment,
    deleteShipment,
    updateShipmentStatus,
    assignShipment,
    approveShipment
} from "../controllers/shipmentsController.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", authorizeRoles("customer", "organization_admin", "super_admin"), createShipment);
router.get("/", authorizeRoles("super_admin", "organization_admin", "customer"), getAllShipments);
router.get("/:id", authorizeRoles("super_admin", "organization_admin", "customer"), getShipmentById);
router.put("/:id", authorizeRoles("super_admin", "organization_admin"), updateShipment);
router.delete("/:id", authorizeRoles("super_admin", "organization_admin"), deleteShipment);
router.patch("/:id/status", authorizeRoles("super_admin", "organization_admin"), updateShipmentStatus);
router.post("/:id/approve", authorizeRoles("super_admin", "organization_admin"), approveShipment);
router.post("/:id/assign", authorizeRoles("super_admin", "organization_admin"), assignShipment);

export default router;
