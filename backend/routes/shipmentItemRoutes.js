import express from "express";
import { authorizeRoles, verifyToken } from "../middlelware/authMiddleware.js";

import {
    createItem,
    getItems,
    updateItem,
    deleteItem
} from "../controllers/shipmentItemController.js";

const router = express.Router();
router.use(verifyToken, authorizeRoles("super_admin", "organization_admin"));

router.post("/", createItem);

router.get("/shipment/:shipmentId", getItems);

router.put("/:id", updateItem);

router.delete("/:id", deleteItem);

export default router;
