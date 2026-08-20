import express from "express";
import { verifyToken, authorizeRoles } from "../middlelware/authMiddleware.js";
import { getGlobalOperations } from "../controllers/globalOperationsController.js";
const router = express.Router();
router.use(verifyToken, authorizeRoles("super_admin"));
router.get("/", getGlobalOperations);
export default router;