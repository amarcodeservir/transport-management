import express from "express";
import { authorizeRoles, verifyToken } from "../middlelware/authMiddleware.js";
import { getSubscriptions, updateSubscription } from "../controllers/subscriptionController.js";

const router = express.Router();
router.use(verifyToken, authorizeRoles("super_admin"));
router.get("/", getSubscriptions);
router.put("/:organizationId", updateSubscription);
export default router;
