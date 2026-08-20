import bcrypt from "bcrypt";
import Vehicle from "../model/Vehicle.js";
import User from "../model/User.js";
import Driver from "../model/Driver.js";
import Trip from "../model/Trip.js";
import FuelLog from "../model/FuelLog.js";
import Maintenance from "../model/Maintenance.js";
import VehicleDocument from "../model/VehicleDocument.js";
import Organization from "../model/Organization.js";
import { recordActivity } from "../utils/activityLogger.js";
import { checkSubscriptionLimit } from "../utils/subscriptionLimits.js";

/* -------------------------------------------------------------------------- */
/* Vehicles                                                                   */
/* -------------------------------------------------------------------------- */
export const createVehicle = async (req, res) => {
  try {
    const {
      vehicle_number, vehicle_type, brand, model, capacity,
      fuel_type, insurance_expiry, fitness_expiry, permit_expiry, status,
    } = req.body;

    const organization_id = req.user?.role === "super_admin" ? (req.body.organization_id || null) : (req.user?.organization_id || null);

    if (!vehicle_number || !vehicle_type) {
      return res.status(400).json({ success: false, message: "vehicle_number and vehicle_type are required" });
    }
    if (!organization_id) {
      return res.status(400).json({ success: false, message: "Organization is required for a vehicle" });
    }
    const organization = await Organization.findById(organization_id);
    if (!organization || String(organization.status).toUpperCase() !== "ACTIVE") {
      return res.status(404).json({ success: false, message: "Active organization not found" });
    }
    const vehicleLimit = await checkSubscriptionLimit(organization_id, "vehicles");
    if (!vehicleLimit.allowed) return res.status(vehicleLimit.statusCode).json({ success: false, message: vehicleLimit.message });

    const existing = await Vehicle.findOne({ vehicle_number: String(vehicle_number).toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Vehicle number already exists" });
    }

    const vehicle = await Vehicle.create({
      vehicle_number: String(vehicle_number).toUpperCase(),
      vehicle_type,
      brand: brand || null,
      model: model || null,
      capacity: capacity || null,
      fuel_type: fuel_type || null,
      insurance_expiry: insurance_expiry || null,
      fitness_expiry: fitness_expiry || null,
      permit_expiry: permit_expiry || null,
      status: status || "AVAILABLE",
      organization_id,
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    console.error("Create Vehicle Error:", error);
    res.status(500).json({ success: false, message: "Failed to create vehicle", error: error.message });
  }
};

export const getVehicles = async (req, res) => {
  try {
    const filter = req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id };
    const vehicles = await Vehicle.find(filter).sort({ created_at: -1 });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error("Get Vehicles Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch vehicles", error: error.message });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const vehicle = await Vehicle.findOne(filter);
    if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });
    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error("Get Vehicle Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch vehicle", error: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const vehicle = await Vehicle.findOne(filter);
    if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });

    const allowed = ["vehicle_number", "vehicle_type", "brand", "model", "capacity", "fuel_type", "insurance_expiry", "fitness_expiry", "permit_expiry", "status"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) vehicle[key] = req.body[key];
    }

    await vehicle.save();
    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error("Update Vehicle Error:", error);
    res.status(500).json({ success: false, message: "Failed to update vehicle", error: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const vehicle = await Vehicle.findOne(filter);
    if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });

    await Vehicle.deleteOne({ _id: id });
    res.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Delete Vehicle Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete vehicle", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* Drivers                                                                    */
/* -------------------------------------------------------------------------- */
export const createDriver = async (req, res) => {
  try {
    const { name, mobile, email, password, license_number, license_expiry, address, joining_date, status } = req.body;
    const organization_id = req.user?.role === "super_admin" ? (req.body.organization_id || null) : (req.user?.organization_id || null);

    if (!organization_id) {
      return res.status(400).json({ success: false, message: "Organization is required for a driver" });
    }
    const organization = await Organization.findById(organization_id);
    if (!organization || String(organization.status).toUpperCase() !== "ACTIVE") {
      return res.status(404).json({ success: false, message: "Active organization not found" });
    }
    const userLimit = await checkSubscriptionLimit(organization_id, "users");
    if (!userLimit.allowed) {
      return res.status(userLimit.statusCode).json({ success: false, message: userLimit.message });
    }
    if (!name || !mobile || !email || !password || !license_number) {
      return res.status(400).json({ success: false, message: "name, mobile, email, password and license_number are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: "Driver password must be at least 6 characters" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingDriver = await Driver.findOne({ license_number: String(license_number).toUpperCase() });
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingDriver) {
      return res.status(409).json({ success: false, message: "Driver license already exists" });
    }
    if (existingUser) {
      return res.status(409).json({ success: false, message: "A login with this email already exists" });
    }

    const normalizedStatus = String(status || "AVAILABLE").toUpperCase().replace(/\s+/g, "_");
    const passwordHash = await bcrypt.hash(String(password), 10);

    const loginUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(mobile).trim(),
      password: passwordHash,
      role: "driver",
      organization_id,
      status: normalizedStatus === "INACTIVE" ? "Inactive" : "Active",
    });

    const driver = await Driver.create({
      name,
      mobile,
      license_number: String(license_number).toUpperCase(),
      license_expiry: license_expiry || null,
      address: address || null,
      joining_date: joining_date || null,
      status: normalizedStatus,
      organization_id,
      user_id: loginUser._id,
    });

    res.status(201).json({
      success: true,
      message: "Driver and driver login created successfully",
      data: driver,
    });
  } catch (error) {
    console.error("Create Driver Error:", error);
    res.status(500).json({ success: false, message: "Failed to create driver", error: error.message });
  }
};

export const linkDriverLogin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;
    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    if (driver.user_id) {
      return res.status(409).json({ success: false, message: "Driver already has a linked login account" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(409).json({ success: false, message: "Email already exists" });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const loginUser = await User.create({
      name: driver.name,
      email: normalizedEmail,
      phone: driver.mobile,
      password: passwordHash,
      role: "driver",
      organization_id: driver.organization_id,
      status: "Active",
    });

    driver.user_id = loginUser._id;
    await driver.save();

    res.json({ success: true, message: "Driver login linked successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to link driver login", error: error.message });
  }
};

export const resetDriverPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const driver = await Driver.findById(id);
    if (!driver || !driver.user_id) return res.status(404).json({ success: false, message: "Driver login not found" });

    const passwordHash = await bcrypt.hash(String(password), 10);
    await User.updateOne({ _id: driver.user_id }, { password: passwordHash });

    res.json({ success: true, message: "Driver password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reset driver password", error: error.message });
  }
};

export const getDrivers = async (req, res) => {
  try {
    const filter = req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id };
    const drivers = await Driver.find(filter).populate("user_id", "email status").sort({ created_at: -1 });

    const rows = drivers.map((d) => {
      const doc = d.toJSON();
      return {
        ...doc,
        email: d.user_id?.email || null,
        login_status: d.user_id?.status || null,
      };
    });

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get Drivers Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch drivers", error: error.message });
  }
};

export const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const driver = await Driver.findOne(filter).populate("user_id", "email status");
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
    res.json({ success: true, data: driver });
  } catch (error) {
    console.error("Get Driver Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch driver", error: error.message });
  }
};

export const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const driver = await Driver.findOne(filter);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const allowed = ["name", "mobile", "license_number", "license_expiry", "address", "joining_date", "status"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) driver[key] = req.body[key];
    }

    await driver.save();
    res.json({ success: true, data: driver });
  } catch (error) {
    console.error("Update Driver Error:", error);
    res.status(500).json({ success: false, message: "Failed to update driver", error: error.message });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const driver = await Driver.findOne(filter);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    if (driver.user_id) {
      await User.deleteOne({ _id: driver.user_id });
    }
    await Driver.deleteOne({ _id: id });

    res.json({ success: true, message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Delete Driver Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete driver", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* Trips                                                                      */
/* -------------------------------------------------------------------------- */
export const createTrip = async (req, res) => {
  try {
    const { vehicle_id, driver_id, origin, destination, start_date, status, shipment_id } = req.body;
    const organization_id = req.user?.role === "super_admin" ? (req.body.organization_id || null) : (req.user?.organization_id || null);

    if (!vehicle_id || !driver_id) {
      return res.status(400).json({ success: false, message: "vehicle_id and driver_id are required" });
    }

    const trip = await Trip.create({
      trip_number: `TRP-${Date.now()}`,
      vehicle_id,
      driver_id,
      organization_id,
      origin: origin || "",
      destination: destination || "",
      start_date: start_date || new Date(),
      status: status || "Booked",
      shipment_id: shipment_id || null,
    });

    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create trip", error: error.message });
  }
};

export const getTrips = async (req, res) => {
  try {
    const filter = req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id };
    const trips = await Trip.find(filter)
      .populate("vehicle_id", "vehicle_number vehicle_type")
      .populate("driver_id", "name mobile")
      .populate("shipment_id", "shipment_number tracking_number current_status")
      .sort({ created_at: -1 });

    const data = trips.map((t) => {
      const doc = t.toJSON();
      return {
        ...doc,
        Vehicle: t.vehicle_id,
        Driver: t.driver_id,
        Shipment: t.shipment_id,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Get Trips Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch trips", error: error.message });
  }
};

export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const trip = await Trip.findOne(filter).populate("vehicle_id").populate("driver_id").populate("shipment_id");
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });
    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch trip", error: error.message });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const trip = await Trip.findOne(filter);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    const allowed = ["origin", "destination", "start_date", "end_date", "status"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) trip[key] = req.body[key];
    }

    await trip.save();
    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update trip", error: error.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const trip = await Trip.findOne(filter);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    await Trip.deleteOne({ _id: id });
    res.json({ success: true, message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete trip", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* Fuel Logs                                                                  */
/* -------------------------------------------------------------------------- */
export const createFuelLog = async (req, res) => {
  try {
    const { vehicle_id, driver_id, fuel_date, liters, cost_per_liter, total_cost, odometer_reading } = req.body;
    const organization_id = req.user?.role === "super_admin" ? (req.body.organization_id || null) : (req.user?.organization_id || null);

    if (!vehicle_id || !liters || !cost_per_liter) {
      return res.status(400).json({ success: false, message: "vehicle_id, liters, cost_per_liter are required" });
    }

    const calculatedTotal = total_cost || (Number(liters) * Number(cost_per_liter));

    const fuelLog = await FuelLog.create({
      vehicle_id,
      driver_id: driver_id || null,
      organization_id,
      fuel_date: fuel_date || new Date(),
      liters,
      cost_per_liter,
      total_cost: calculatedTotal,
      odometer_reading: odometer_reading || null,
    });

    res.status(201).json({ success: true, data: fuelLog });
  } catch (error) {
    console.error("Create Fuel Log Error:", error);
    res.status(500).json({ success: false, message: "Failed to create fuel log", error: error.message });
  }
};

export const getFuelLogs = async (req, res) => {
  try {
    const filter = req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id };
    const fuelLogs = await FuelLog.find(filter)
      .populate("vehicle_id", "vehicle_number vehicle_type")
      .populate("driver_id", "name mobile")
      .sort({ fuel_date: -1 });

    res.json({ success: true, data: fuelLogs });
  } catch (error) {
    console.error("Get Fuel Logs Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch fuel logs", error: error.message });
  }
};

export const getFuelLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const fuelLog = await FuelLog.findOne(filter);
    if (!fuelLog) return res.status(404).json({ success: false, message: "Fuel log not found" });
    res.json({ success: true, data: fuelLog });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch fuel log", error: error.message });
  }
};

export const updateFuelLog = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const fuelLog = await FuelLog.findOne(filter);
    if (!fuelLog) return res.status(404).json({ success: false, message: "Fuel log not found" });

    const allowed = ["fuel_date", "liters", "cost_per_liter", "total_cost", "odometer_reading"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) fuelLog[key] = req.body[key];
    }

    await fuelLog.save();
    res.json({ success: true, data: fuelLog });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update fuel log", error: error.message });
  }
};

export const deleteFuelLog = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const fuelLog = await FuelLog.findOne(filter);
    if (!fuelLog) return res.status(404).json({ success: false, message: "Fuel log not found" });

    await FuelLog.deleteOne({ _id: id });
    res.json({ success: true, message: "Fuel log deleted successfully" });
  } catch (error) {
    console.error("Delete Fuel Log Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete fuel log", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* Maintenance                                                                */
/* -------------------------------------------------------------------------- */
export const createMaintenance = async (req, res) => {
  try {
    const { vehicle_id, service_type, service_date, cost, description, performed_by } = req.body;
    const organization_id = req.user?.role === "super_admin" ? (req.body.organization_id || null) : (req.user?.organization_id || null);

    if (!vehicle_id || !service_type || !cost) {
      return res.status(400).json({ success: false, message: "vehicle_id, service_type, and cost are required" });
    }

    const maintenance = await Maintenance.create({
      vehicle_id,
      organization_id,
      service_type,
      service_date: service_date || new Date(),
      cost,
      description: description || null,
      performed_by: performed_by || null,
    });

    res.status(201).json({ success: true, data: maintenance });
  } catch (error) {
    console.error("Create Maintenance Error:", error);
    res.status(500).json({ success: false, message: "Failed to create maintenance record", error: error.message });
  }
};

export const getMaintenanceRecords = async (req, res) => {
  try {
    const filter = req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id };
    const records = await Maintenance.find(filter)
      .populate("vehicle_id", "vehicle_number vehicle_type")
      .sort({ service_date: -1 });

    res.json({ success: true, data: records });
  } catch (error) {
    console.error("Get Maintenance Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch maintenance records", error: error.message });
  }
};

export const getMaintenanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const record = await Maintenance.findOne(filter);
    if (!record) return res.status(404).json({ success: false, message: "Maintenance record not found" });
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch maintenance record", error: error.message });
  }
};

export const updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const record = await Maintenance.findOne(filter);
    if (!record) return res.status(404).json({ success: false, message: "Maintenance record not found" });

    const allowed = ["service_type", "service_date", "cost", "description", "performed_by"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) record[key] = req.body[key];
    }

    await record.save();
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update maintenance record", error: error.message });
  }
};

export const deleteMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const record = await Maintenance.findOne(filter);
    if (!record) return res.status(404).json({ success: false, message: "Maintenance record not found" });

    await Maintenance.deleteOne({ _id: id });
    res.json({ success: true, message: "Maintenance record deleted successfully" });
  } catch (error) {
    console.error("Delete Maintenance Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete maintenance record", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* Vehicle Documents                                                         */
/* -------------------------------------------------------------------------- */
export const createDocument = async (req, res) => {
  try {
    const { vehicle_id, document_type, document_number, issue_date, expiry_date, document_url } = req.body;
    const organization_id = req.user?.role === "super_admin" ? (req.body.organization_id || null) : (req.user?.organization_id || null);

    if (!vehicle_id || !document_type) {
      return res.status(400).json({ success: false, message: "vehicle_id and document_type are required" });
    }

    const doc = await VehicleDocument.create({
      vehicle_id,
      organization_id,
      document_type,
      document_number: document_number || null,
      issue_date: issue_date || null,
      expiry_date: expiry_date || null,
      document_url: document_url || null,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error("Create Vehicle Document Error:", error);
    res.status(500).json({ success: false, message: "Failed to create vehicle document", error: error.message });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const filter = req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id };
    const docs = await VehicleDocument.find(filter)
      .populate("vehicle_id", "vehicle_number vehicle_type")
      .sort({ created_at: -1 });

    res.json({ success: true, data: docs });
  } catch (error) {
    console.error("Get Vehicle Documents Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch vehicle documents", error: error.message });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const doc = await VehicleDocument.findOne(filter);
    if (!doc) return res.status(404).json({ success: false, message: "Vehicle document not found" });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch vehicle document", error: error.message });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const doc = await VehicleDocument.findOne(filter);
    if (!doc) return res.status(404).json({ success: false, message: "Vehicle document not found" });

    const allowed = ["document_type", "document_number", "issue_date", "expiry_date", "document_url"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) doc[key] = req.body[key];
    }

    await doc.save();
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update vehicle document", error: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }) };
    const doc = await VehicleDocument.findOne(filter);
    if (!doc) return res.status(404).json({ success: false, message: "Vehicle document not found" });

    await VehicleDocument.deleteOne({ _id: id });
    res.json({ success: true, message: "Vehicle document deleted successfully" });
  } catch (error) {
    console.error("Delete Vehicle Document Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete vehicle document", error: error.message });
  }
};
