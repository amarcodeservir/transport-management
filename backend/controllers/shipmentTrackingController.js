import ShipmentTracking from "../model/ShipmentTracking.js";
import Shipment from "../model/Shipment.js";
import Driver from "../model/Driver.js";
import { findScopedShipment } from "../utils/shipmentAccess.js";

const telemetryFields = ["driver_id", "latitude", "longitude", "speed", "accuracy", "heading"];

const parseTelemetry = (body) => {
  const data = {};
  for (const field of telemetryFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const value = body[field];
    data[field] = value === undefined || value === null || value === "" ? null : Number(value);
    if (data[field] !== null && !Number.isFinite(data[field])) return { error: `${field} must be a valid number` };
  }
  if (data.latitude !== undefined && data.latitude !== null && (data.latitude < -90 || data.latitude > 90)) return { error: "latitude is outside the valid range" };
  if (data.longitude !== undefined && data.longitude !== null && (data.longitude < -180 || data.longitude > 180)) return { error: "longitude is outside the valid range" };
  if (data.speed !== undefined && data.speed !== null && data.speed < 0) return { error: "speed cannot be negative" };
  if (data.accuracy !== undefined && data.accuracy !== null && data.accuracy < 0) return { error: "accuracy cannot be negative" };
  if (data.heading !== undefined && data.heading !== null && (data.heading < 0 || data.heading > 360)) return { error: "heading must be between 0 and 360 degrees" };
  return { data };
};

export const addTracking = async (req, res) => {
  try {
    const { shipment_id, status, location, remarks, tracking_date } = req.body;
    const telemetry = parseTelemetry(req.body);
    if (telemetry.error) return res.status(400).json({ message: telemetry.error });

    if (!shipment_id || !status) {
      return res.status(400).json({ message: "shipment_id and status are required" });
    }

    const shipment = await findScopedShipment(req, shipment_id);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    if (telemetry.data.driver_id) {
      const driver = await Driver.findOne({ _id: telemetry.data.driver_id, organization_id: shipment.organization_id });
      if (!driver) return res.status(404).json({ message: "Driver not found in this organization" });
    }

    const result = await ShipmentTracking.create({
      shipment_id,
      status,
      location: location || null,
      remarks: remarks || null,
      tracking_date: tracking_date || new Date(),
      ...telemetry.data,
    });

    shipment.current_status = status;
    await shipment.save();

    res.status(201).json({
      message: "Tracking added successfully",
      id: result.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add tracking",
      error: error.message,
    });
  }
};

export const getTracking = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    if (!(await findScopedShipment(req, shipmentId))) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const tracking = await ShipmentTracking.find({ shipment_id: shipmentId }).sort({ tracking_date: -1 });
    res.json({ tracking });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tracking",
      error: error.message,
    });
  }
};

export const updateTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, remarks, tracking_date } = req.body;
    const telemetry = parseTelemetry(req.body);
    if (telemetry.error) return res.status(400).json({ message: telemetry.error });

    const tracking = await ShipmentTracking.findById(id);
    if (!tracking) return res.status(404).json({ message: "Tracking record not found" });

    const shipment = await findScopedShipment(req, tracking.shipment_id);
    if (!shipment) return res.status(404).json({ message: "Tracking record not found" });

    if (telemetry.data.driver_id) {
      const driver = await Driver.findOne({ _id: telemetry.data.driver_id, organization_id: shipment.organization_id });
      if (!driver) return res.status(404).json({ message: "Driver not found in this organization" });
    }

    tracking.status = status || tracking.status;
    tracking.location = location || tracking.location;
    tracking.remarks = remarks || tracking.remarks;
    if (tracking_date) tracking.tracking_date = tracking_date;
    Object.assign(tracking, telemetry.data);

    await tracking.save();

    res.json({ message: "Tracking updated successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update tracking",
      error: error.message,
    });
  }
};
