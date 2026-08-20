import express from "express";
import { authorizeRoles, verifyToken } from "../middlelware/authMiddleware.js";

import {
    createPackage,
    getPackages,
    updatePackage,
    deletePackage
} from "../controllers/shipmentPackageController.js";

const router = express.Router();
router.use(verifyToken, authorizeRoles("super_admin", "organization_admin"));

router.post("/", createPackage);

router.get("/shipment/:shipmentId", getPackages);

router.put("/:id", updatePackage);

router.delete("/:id", deletePackage);

export default router;
