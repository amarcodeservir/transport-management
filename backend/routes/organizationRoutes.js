import express from "express";
import { authorizeRoles, verifyToken } from "../middlelware/authMiddleware.js";
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  createOrganizationAdmin,
  getOrganizationAdmins,
  updateOrganizationAdmin,
  resetOrganizationAdminPassword,
  getDashboardStats,
  getMyOrganization,
  updateMyOrganization,
  getOrganizationBranding,
  uploadMyBrandingAssets,
  viewBrandingAsset,
} from "../controllers/organizationController.js";
import { handleBrandingUpload } from "../middlelware/brandingUpload.js";

const router = express.Router();

router.get("/branding/files/:filename", viewBrandingAsset);
router.use(verifyToken);
router.post("/", authorizeRoles("super_admin"), createOrganization);
router.get("/", authorizeRoles("super_admin", "organization_admin"), getOrganizations);
router.get("/dashboard", authorizeRoles("super_admin", "organization_admin"), getDashboardStats);
router.get("/branding", authorizeRoles("admin", "super_admin", "organization_admin", "customer", "driver"), getOrganizationBranding);
router.get("/me", authorizeRoles("organization_admin"), getMyOrganization);
router.put("/me", authorizeRoles("organization_admin"), updateMyOrganization);
router.post("/me/branding-assets", authorizeRoles("organization_admin"), handleBrandingUpload, uploadMyBrandingAssets);
// /admins routes must be defined BEFORE /:id to avoid Express treating "admins" as an ID
router.post("/admins", authorizeRoles("super_admin"), createOrganizationAdmin);
router.get("/admins", authorizeRoles("super_admin"), getOrganizationAdmins);
router.put("/admins/:id", authorizeRoles("super_admin"), updateOrganizationAdmin);
router.post("/admins/:id/reset-password", authorizeRoles("super_admin"), resetOrganizationAdminPassword);
router.get("/:id", authorizeRoles("super_admin", "organization_admin"), getOrganizationById);
router.put("/:id", authorizeRoles("super_admin"), updateOrganization);

export default router;
