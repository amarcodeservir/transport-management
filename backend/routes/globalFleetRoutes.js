import express from "express";
import { verifyToken, authorizeRoles } from "../middlelware/authMiddleware.js";
import { getGlobalFleet } from "../controllers/globalFleetController.js";
const router = express.Router();
router.use(verifyToken, authorizeRoles("super_admin"));
router.get("/", getGlobalFleet);
export default router;