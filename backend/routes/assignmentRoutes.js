import express from "express";
import { verifyToken, authorizeRoles } from "../middlelware/authMiddleware.js";
import { getAssignments, createAssignment, updateAssignmentStatus } from "../controllers/assignmentController.js";

const router = express.Router();
router.use(verifyToken);
router.get("/", authorizeRoles("super_admin", "organization_admin", "driver"), getAssignments);
router.post("/", authorizeRoles("super_admin", "organization_admin"), createAssignment);
router.patch("/:id/status", authorizeRoles("super_admin", "organization_admin", "driver"), updateAssignmentStatus);
export default router;
