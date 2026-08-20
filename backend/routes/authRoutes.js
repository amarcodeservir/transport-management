import express from "express";
import { login, logout, changePassword } from "../controllers/authController.js";
import { verifyToken } from "../middlelware/authMiddleware.js";

const router = express.Router();
router.post("/login", login);
router.post("/logout", logout);
router.post("/change-password", verifyToken, changePassword);

export default router;
