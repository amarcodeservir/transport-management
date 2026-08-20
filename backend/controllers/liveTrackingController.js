import Shipment from "../model/Shipment.js";
import ShipmentTracking from "../model/ShipmentTracking.js";
import Driver from "../model/Driver.js";
import ShipmentAssignment from "../model/ShipmentAssignment.js";
import Trip from "../model/Trip.js";

const activeStatuses = ["ASSIGNED", "ACCEPTED", "IN_TRANSIT", "OUT_FOR_DELIVERY"];
const optionalNumber = (value) => (value === undefined || value === null || value === "" ? null : Number(value));
const normalizeStatus = (value) => String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");

export const getLiveTracking = async (req, res) => {
  try {
    const filter = { current_status: { $in: activeStatuses } };
    if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    if (req.user?.role === "driver") {
      const driver = await Driver.findOne({ user_id: req.user.id, organization_id: req.user.organization_id });
      if (!driver) return res.status(403).json({ success: false, message: "Driver login is not linked to a fleet driver" });

      const acceptedAssignments = await ShipmentAssignment.find({ driver_id: driver._id, status: "ACCEPTED" }).select("shipment_id");
      const shipmentIds = acceptedAssignments.map((a) => a.shipment_id);
      filter._id = { $in: shipmentIds };
    }

    const shipments = await Shipment.find(filter)
      .populate("vehicle_id", "vehicle_number vehicle_type")
      .populate("driver_id", "name mobile")
      .sort({ updated_at: -1 });

    const rows = await Promise.all(
      shipments.map(async (s) => {
        const doc = s.toJSON();
        const trip = await Trip.findOne({ shipment_id: s._id });
        const latest = await ShipmentTracking.findOne({ shipment_id: s._id }).sort({ tracking_date: -1, _id: -1 });

        return {
          shipment_id: doc.id,
          id: doc.id,
          shipment_number: doc.shipment_number,
          tracking_number: doc.tracking_number,
          origin: doc.origin,
          destination: doc.destination,
          current_status: doc.current_status,
          vehicle_number: s.vehicle_id?.vehicle_number || null,
          vehicle_type: s.vehicle_id?.vehicle_type || null,
          driver_name: s.driver_id?.name || null,
          driver_mobile: s.driver_id?.mobile || null,
          trip_id: trip ? trip.id : null,
          trip_number: trip ? trip.trip_number : null,
          trip_status: trip ? trip.status : null,
          tracking_driver_id: latest?.driver_id || null,
          location: latest?.location || null,
          latitude: latest?.latitude ?? null,
          longitude: latest?.longitude ?? null,
          speed: latest?.speed ?? null,
          accuracy: latest?.accuracy ?? null,
          heading: latest?.heading ?? null,
          tracking_date: latest?.tracking_date || null,
          tracking_remarks: latest?.remarks || null,
        };
      })
    );

    res.json({ success: true, data: rows, updated_at: new Date() });
  } catch (error) {
    console.error("Live Tracking Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch live tracking", error: error.message });
  }
};

export const updateLiveLocation = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { latitude, longitude, location, remarks, status, speed, accuracy, heading } = req.body;

    const numericLatitude = Number(latitude);
    const numericLongitude = Number(longitude);
    const numericSpeed = optionalNumber(speed);
    const numericAccuracy = optionalNumber(accuracy);
    const numericHeading = optionalNumber(heading);

    const missingCoordinates = latitude === undefined || latitude === null || latitude === "" || longitude === undefined || longitude === null || longitude === "";
    if (missingCoordinates || !Number.isFinite(numericLatitude) || !Number.isFinite(numericLongitude)) {
      return res.status(400).json({ success: false, message: "Valid latitude and longitude are required" });
    }
    if (numericLatitude < -90 || numericLatitude > 90 || numericLongitude < -180 || numericLongitude > 180) {
      return res.status(400).json({ success: false, message: "Latitude or longitude is outside the valid range" });
    }
    if ([numericSpeed, numericAccuracy, numericHeading].some((value) => value !== null && !Number.isFinite(value))) {
      return res.status(400).json({ success: false, message: "speed, accuracy and heading must be valid numbers" });
    }
    if (numericSpeed !== null && numericSpeed < 0) {
      return res.status(400).json({ success: false, message: "speed cannot be negative" });
    }
    if (numericAccuracy !== null && numericAccuracy < 0) {
      return res.status(400).json({ success: false, message: "accuracy cannot be negative" });
    }
    if (numericHeading !== null && (numericHeading < 0 || numericHeading > 360)) {
      return res.status(400).json({ success: false, message: "heading must be between 0 and 360 degrees" });
    }

    const normalizedLocation = String(location || "").trim() || `GPS: ${numericLatitude.toFixed(6)}, ${numericLongitude.toFixed(6)}`;
    const driver = req.user?.role === "driver" ? await Driver.findOne({ user_id: req.user.id, organization_id: req.user.organization_id }) : null;
    if (req.user?.role === "driver" && !driver) return res.status(403).json({ success: false, message: "Driver login is not linked to a fleet driver" });

    const filter = {
      _id: shipmentId,
      ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }),
      ...(driver ? { driver_id: driver._id } : {}),
    };

    const shipment = await Shipment.findOne(filter);
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found" });

    if (driver) {
      const acceptedAssignment = await ShipmentAssignment.findOne({ shipment_id: shipment._id, driver_id: driver._id, status: "ACCEPTED" });
      if (!acceptedAssignment) return res.status(409).json({ success: false, message: "Accept this assignment before starting the trip" });
    }

    const currentStatus = normalizeStatus(shipment.current_status || "ASSIGNED");
    const requestedStatus = normalizeStatus(status || (currentStatus === "ASSIGNED" ? "IN_TRANSIT" : currentStatus));

    const allowedTransitions = {
      ASSIGNED: ["IN_TRANSIT"],
      IN_TRANSIT: ["IN_TRANSIT", "OUT_FOR_DELIVERY"],
      OUT_FOR_DELIVERY: ["OUT_FOR_DELIVERY", "DELIVERED"],
    };

    if (!allowedTransitions[currentStatus]?.includes(requestedStatus)) {
      return res.status(409).json({ success: false, message: `Invalid tracking transition: ${currentStatus} -> ${requestedStatus}` });
    }

    const tracking = await ShipmentTracking.create({
      shipment_id: shipmentId,
      driver_id: driver?._id || shipment.driver_id || null,
      status: requestedStatus,
      location: normalizedLocation,
      latitude: numericLatitude,
      longitude: numericLongitude,
      speed: numericSpeed,
      accuracy: numericAccuracy,
      heading: numericHeading,
      remarks: remarks || "Live location updated",
    });

    if (requestedStatus !== currentStatus) {
      shipment.current_status = requestedStatus;
      await shipment.save();
    }

    const tripStatus = { IN_TRANSIT: "In Transit", OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered" }[requestedStatus];
    if (tripStatus) {
      await Trip.updateOne(
        { shipment_id: shipment._id, organization_id: shipment.organization_id },
        { status: tripStatus, ...(requestedStatus === "DELIVERED" ? { end_date: new Date() } : {}) }
      );
    }

    res.status(201).json({ success: true, message: "Live location updated", data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update live location", error: error.message });
  }
};
