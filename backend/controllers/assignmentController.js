import Shipment from "../model/Shipment.js";
import Vehicle from "../model/Vehicle.js";
import Driver from "../model/Driver.js";
import Trip from "../model/Trip.js";
import ShipmentTracking from "../model/ShipmentTracking.js";
import ShipmentAssignment from "../model/ShipmentAssignment.js";
import Notification from "../model/Notification.js";

const activeStatuses = ["ASSIGNED", "ACCEPTED"];
const orgWhere = (req) => req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id };

export const getAssignments = async (req, res) => {
  try {
    const filter = { ...orgWhere(req) };
    if (req.user?.role === "driver") {
      const linkedDriver = await Driver.findOne({ user_id: req.user.id, organization_id: req.user.organization_id });
      if (!linkedDriver) return res.status(403).json({ success: false, message: "Driver login is not linked to a fleet driver" });
      filter.driver_id = linkedDriver._id;
    }
    if (req.query.status) filter.status = req.query.status;

    const assignments = await ShipmentAssignment.find(filter)
      .populate("shipment_id", "shipment_number tracking_number origin destination current_status booking_date")
      .populate("vehicle_id", "vehicle_number vehicle_type status")
      .populate("driver_id", "name mobile license_number status")
      .sort({ assigned_at: -1 });

    const formatted = assignments.map((a) => {
      const doc = a.toJSON();
      return {
        ...doc,
        Shipment: doc.shipment_id,
        Vehicle: doc.vehicle_id,
        Driver: doc.driver_id,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch assignments", error: error.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const { shipment_id, vehicle_id, driver_id, remarks } = req.body;
    if (!shipment_id || !vehicle_id || !driver_id) {
      return res.status(400).json({ success: false, message: "shipment_id, vehicle_id and driver_id are required" });
    }

    const filter = orgWhere(req);
    const shipment = await Shipment.findOne({ _id: shipment_id, ...filter });
    const vehicle = await Vehicle.findOne({ _id: vehicle_id, ...filter });
    const driver = await Driver.findOne({ _id: driver_id, ...filter });

    if (!shipment || !vehicle || !driver) {
      return res.status(404).json({ success: false, message: "Shipment, vehicle or driver not found" });
    }
    if (!driver.user_id) {
      return res.status(409).json({ success: false, message: "Selected driver does not have a linked driver login" });
    }

    if (shipment.current_status !== "UNASSIGNED") {
      return res.status(409).json({ success: false, message: "Shipment must be approved before assignment" });
    }
    if (!["AVAILABLE", "ACTIVE"].includes(String(vehicle.status).toUpperCase()) || !["AVAILABLE", "ACTIVE"].includes(String(driver.status).toUpperCase())) {
      return res.status(409).json({ success: false, message: "Vehicle or driver is not available" });
    }

    const active = await ShipmentAssignment.findOne({ shipment_id, status: { $in: activeStatuses } });
    if (active) {
      return res.status(409).json({ success: false, message: "Shipment already has an active assignment" });
    }

    const assignment = await ShipmentAssignment.create({
      shipment_id,
      vehicle_id,
      driver_id,
      organization_id: req.user?.organization_id || shipment.organization_id || null,
      status: "ASSIGNED",
      remarks: remarks || null,
    });

    shipment.vehicle_id = vehicle_id;
    shipment.driver_id = driver_id;
    shipment.current_status = "ASSIGNED";
    await shipment.save();

    vehicle.status = "ASSIGNED";
    await vehicle.save();

    driver.status = "ASSIGNED";
    await driver.save();

    let trip = await Trip.findOne({ shipment_id });
    if (!trip) {
      trip = await Trip.create({
        trip_number: `TRP-${shipment.shipment_number || shipment.id}-${Date.now()}`,
        vehicle_id,
        driver_id,
        origin: shipment.origin || "",
        destination: shipment.destination || "",
        start_date: new Date(),
        status: "Booked",
        shipment_id,
        organization_id: req.user?.organization_id || shipment.organization_id || null,
      });
    }

    await ShipmentTracking.create({
      shipment_id,
      status: "ASSIGNED",
      remarks: remarks || "Shipment assigned to vehicle and driver",
    });

    await Notification.create({
      user_id: driver.user_id,
      organization_id: null,
      type: "INFO",
      title: `New assignment: ${shipment.shipment_number}`,
      message: `${vehicle.vehicle_number} · ${shipment.origin || "-"} to ${shipment.destination || "-"}`,
      link: "/dashboard/operations/assignments",
    });

    res.status(201).json({ success: true, message: "Assignment created successfully", assignment, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create assignment", error: error.message });
  }
};

export const updateAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const allowed = ["ACCEPTED", "REJECTED", "RELEASED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid assignment status" });
    }

    const assignment = await ShipmentAssignment.findOne({ _id: id, ...orgWhere(req) });
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const transitions = {
      ASSIGNED: ["ACCEPTED", "REJECTED", "RELEASED"],
      ACCEPTED: ["RELEASED"],
      REJECTED: [],
      RELEASED: [],
    };
    if (!transitions[assignment.status]?.includes(status)) {
      return res.status(409).json({ success: false, message: `Invalid assignment transition: ${assignment.status} -> ${status}` });
    }

    if (req.user?.role === "driver") {
      const linkedDriver = await Driver.findOne({ user_id: req.user.id });
      if (!linkedDriver || String(linkedDriver._id) !== String(assignment.driver_id) || assignment.status !== "ASSIGNED" || !["ACCEPTED", "REJECTED"].includes(status)) {
        return res.status(403).json({ success: false, message: "You cannot update this assignment" });
      }
    } else if (status !== "RELEASED") {
      return res.status(403).json({ success: false, message: "Organization admins can only release an assignment" });
    }

    const now = new Date();
    assignment.status = status;
    if (remarks !== undefined) assignment.remarks = remarks;
    if (status === "ACCEPTED") assignment.accepted_at = now;
    if (status === "REJECTED") assignment.rejected_at = now;
    if (status === "RELEASED") assignment.released_at = now;
    await assignment.save();

    const shipment = await Shipment.findById(assignment.shipment_id);
    const shipmentStatus = status === "REJECTED" || status === "RELEASED" ? "UNASSIGNED" : "ASSIGNED";
    if (shipment) {
      shipment.current_status = shipmentStatus;
      if (shipmentStatus === "UNASSIGNED") {
        shipment.vehicle_id = null;
        shipment.driver_id = null;
      }
      await shipment.save();
    }

    if (shipmentStatus === "UNASSIGNED") {
      await Vehicle.updateOne({ _id: assignment.vehicle_id }, { status: "AVAILABLE" });
      await Driver.updateOne({ _id: assignment.driver_id }, { status: "AVAILABLE" });
      await Trip.updateOne({ shipment_id: assignment.shipment_id }, { status: "Cancelled" });
    } else if (status === "ACCEPTED") {
      await Trip.updateOne({ shipment_id: assignment.shipment_id }, { status: "ACCEPTED" });
    }

    await ShipmentTracking.create({
      shipment_id: assignment.shipment_id,
      status: shipmentStatus,
      remarks: remarks || `Assignment ${status.toLowerCase()}`,
    });

    const driverObj = await Driver.findById(assignment.driver_id);
    await Notification.create({
      user_id: req.user?.role === "driver" ? null : driverObj?.user_id || null,
      organization_id: req.user?.role === "driver" ? assignment.organization_id : null,
      type: status === "REJECTED" ? "WARNING" : status === "ACCEPTED" ? "SUCCESS" : "INFO",
      title: `Assignment ${status.toLowerCase()}`,
      message: `Shipment ${shipment?.shipment_number || assignment.shipment_id} assignment is now ${status.toLowerCase()}.`,
      link: "/dashboard/operations/assignments",
    });

    res.json({ success: true, message: "Assignment status updated", assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update assignment", error: error.message });
  }
};
