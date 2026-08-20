import express from "express";
import { getNearbyTransporters, createTransportBooking } from "../controllers/nearbyTransportController.js";
import { authorizeRoles, verifyToken } from "../middlelware/authMiddleware.js";

const router = express.Router();
router.get("/nearby", getNearbyTransporters);
router.post("/bookings", verifyToken, authorizeRoles("customer"), createTransportBooking);
export default router;
