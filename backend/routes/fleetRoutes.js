import express from "express";
import { authorizeRoles, verifyToken } from "../middlelware/authMiddleware.js";
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  createDriver,
  linkDriverLogin,
  resetDriverPassword,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  createFuelLog,
  getFuelLogs,
  getFuelLogById,
  updateFuelLog,
  deleteFuelLog,
  createMaintenance,
  getMaintenanceRecords,
  getMaintenanceById,
  updateMaintenance,
  deleteMaintenance,
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} from "../controllers/fleetController.js";

const router = express.Router();

router.use(verifyToken, authorizeRoles("super_admin", "organization_admin"));

// Vehicles
router.post("/vehicles", createVehicle);
router.get("/vehicles", getVehicles);
router.get("/vehicles/:id", getVehicleById);
router.put("/vehicles/:id", updateVehicle);
router.delete("/vehicles/:id", deleteVehicle);

// Drivers
router.post("/drivers", createDriver);
router.post("/drivers/:id/link-login", linkDriverLogin);
router.post("/drivers/:id/reset-password", resetDriverPassword);
router.get("/drivers", getDrivers);
router.get("/drivers/:id", getDriverById);
router.put("/drivers/:id", updateDriver);
router.delete("/drivers/:id", deleteDriver);

// Trips
router.post("/trips", createTrip);
router.get("/trips", getTrips);
router.get("/trips/:id", getTripById);
router.put("/trips/:id", updateTrip);
router.delete("/trips/:id", deleteTrip);

// Fuel logs
router.post("/fuel-logs", createFuelLog);
router.get("/fuel-logs", getFuelLogs);
router.get("/fuel-logs/:id", getFuelLogById);
router.put("/fuel-logs/:id", updateFuelLog);
router.delete("/fuel-logs/:id", deleteFuelLog);

// Maintenance
router.post("/maintenance", createMaintenance);
router.get("/maintenance", getMaintenanceRecords);
router.get("/maintenance/:id", getMaintenanceById);
router.put("/maintenance/:id", updateMaintenance);
router.delete("/maintenance/:id", deleteMaintenance);

// Documents
router.post("/vehicle-documents", createDocument);
router.get("/vehicle-documents", getDocuments);
router.get("/vehicle-documents/:id", getDocumentById);
router.put("/vehicle-documents/:id", updateDocument);
router.delete("/vehicle-documents/:id", deleteDocument);

export default router;
