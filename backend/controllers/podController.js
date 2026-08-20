import fs from "fs/promises";
import path from "path";
import Shipment from "../model/Shipment.js";
import ShipmentTracking from "../model/ShipmentTracking.js";
import Driver from "../model/Driver.js";
import Vehicle from "../model/Vehicle.js";
import Trip from "../model/Trip.js";
import ShipmentAssignment from "../model/ShipmentAssignment.js";
import Notification from "../model/Notification.js";
import { POD_UPLOAD_DIR } from "../middlelware/podUpload.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const podStatuses = ["OUT_FOR_DELIVERY", "DELIVERED", "POD_UPLOADED", "COMPLETED"];
const POD_FILE_PREFIX = "/api/pod/files/";

const normalizePodUrl = (value) => {
  try {
    const parsed = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
};

const getStoredPodFilename = (value) => {
  const reference = String(value || "");
  if (!reference.startsWith(POD_FILE_PREFIX)) return null;
  try {
    const filename = decodeURIComponent(reference.slice(POD_FILE_PREFIX.length));
    if (filename !== path.basename(filename) || !/^[a-f0-9-]+\.(pdf|jpg|png|webp)$/i.test(filename)) return null;
    return filename;
  } catch {
    return null;
  }
};

const isValidPodReference = (value) => Boolean(getStoredPodFilename(value) || normalizePodUrl(value));

const removeFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") console.error("POD file cleanup error:", error);
  }
};

const removeStoredPod = async (reference) => {
  const filename = getStoredPodFilename(reference);
  if (filename) await removeFile(path.join(POD_UPLOAD_DIR, filename));
};

export const getDeliveries = async (req, res) => {
  try {
    const filter = { current_status: { $in: podStatuses } };
    if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    if (req.user?.role === "driver") {
      const driver = await Driver.findOne({ user_id: req.user.id, organization_id: req.user.organization_id });
      if (!driver) return res.status(403).json({ success: false, message: "Driver login is not linked to a fleet driver" });
      filter.driver_id = driver._id;
    }

    const shipments = await Shipment.find(filter)
      .populate("vehicle_id", "vehicle_number vehicle_type")
      .populate("driver_id", "name mobile")
      .sort({ updated_at: -1 });

    const data = await Promise.all(
      shipments.map(async (s) => {
        const doc = s.toJSON();
        const latestTracking = await ShipmentTracking.findOne({ shipment_id: s._id }).sort({ tracking_date: -1, _id: -1 });
        return {
          shipment_id: doc.id,
          id: doc.id,
          shipment_number: doc.shipment_number,
          tracking_number: doc.tracking_number,
          origin: doc.origin,
          destination: doc.destination,
          current_status: doc.current_status,
          expected_delivery_date: doc.expected_delivery_date,
          pod_url: doc.pod_url,
          pod_uploaded_at: doc.pod_uploaded_at,
          vehicle_id: doc.vehicle_id,
          driver_id: doc.driver_id,
          vehicle_number: s.vehicle_id?.vehicle_number || null,
          vehicle_type: s.vehicle_id?.vehicle_type || null,
          driver_name: s.driver_id?.name || null,
          driver_mobile: s.driver_id?.mobile || null,
          latest_remarks: latestTracking?.remarks || null,
          tracking_date: latestTracking?.tracking_date || null,
        };
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error("POD list error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch deliveries", error: error.message });
  }
};

export const submitDeliveryPod = async (req, res) => {
  let fileSavedToShipment = false;
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: "Select a POD photo or PDF file" });

    const driver = req.user?.role === "driver" ? await Driver.findOne({ user_id: req.user.id }) : null;
    if (req.user?.role === "driver" && !driver) {
      await removeFile(req.file.path);
      return res.status(403).json({ success: false, message: "Driver login is not linked to a fleet driver" });
    }

    const filter = {
      _id: id,
      ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }),
      ...(driver ? { driver_id: driver._id } : {}),
    };

    const shipment = await Shipment.findOne(filter);
    if (!shipment) {
      await removeFile(req.file.path);
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    if (!["DELIVERED", "POD_UPLOADED"].includes(shipment.current_status)) {
      await removeFile(req.file.path);
      return res.status(409).json({ success: false, message: "POD can be uploaded only after delivery" });
    }

    const status = "POD_UPLOADED";
    const previousPod = shipment.pod_url;

    // Support Cloudinary upload if configured, else local filename reference
    let storedPod;
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      storedPod = await uploadToCloudinary(req.file.path, "transport_management/pod");
    } else {
      storedPod = `${POD_FILE_PREFIX}${encodeURIComponent(req.file.filename)}`;
    }

    shipment.pod_url = storedPod;
    shipment.pod_uploaded_at = new Date();
    shipment.current_status = status;
    await shipment.save();

    fileSavedToShipment = true;
    if (previousPod && previousPod !== storedPod) await removeStoredPod(previousPod);

    await ShipmentTracking.create({
      shipment_id: id,
      status,
      location: shipment.destination || null,
      remarks: remarks || "Proof of delivery submitted",
    });

    await Notification.create({
      user_id: null,
      organization_id: shipment.organization_id,
      type: "SUCCESS",
      title: `POD uploaded: ${shipment.shipment_number}`,
      message: "Proof of delivery is available and the shipment is ready for completion.",
      link: "/dashboard",
    });

    if (shipment.customer_id) {
      await Notification.create({
        user_id: shipment.customer_id,
        organization_id: null,
        type: "SUCCESS",
        title: `POD uploaded: ${shipment.shipment_number}`,
        message: "Proof of delivery is now available for your shipment.",
        link: "/dashboard/shipments/all",
      });
    }

    res.json({ success: true, message: "POD submitted successfully", data: shipment });
  } catch (error) {
    if (!fileSavedToShipment) await removeFile(req.file?.path);
    console.error("POD submit error:", error);
    res.status(500).json({ success: false, message: "Failed to submit POD", error: error.message });
  }
};

export const viewDeliveryPod = async (req, res) => {
  try {
    const filename = getStoredPodFilename(`${POD_FILE_PREFIX}${req.params.filename}`);
    if (!filename) return res.status(400).json({ success: false, message: "Invalid POD file" });

    const driver = req.user?.role === "driver" ? await Driver.findOne({ user_id: req.user.id }) : null;
    if (req.user?.role === "driver" && !driver) return res.status(403).json({ success: false, message: "Driver login is not linked to a fleet driver" });

    const filter = {
      pod_url: `${POD_FILE_PREFIX}${filename}`,
      ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }),
      ...(driver ? { driver_id: driver._id } : {}),
    };

    const shipment = await Shipment.findOne(filter);
    if (!shipment) return res.status(404).json({ success: false, message: "POD file not found" });

    const filePath = path.join(POD_UPLOAD_DIR, filename);
    await fs.access(filePath);

    const extension = path.extname(filename).toLowerCase();
    const mimeTypes = { ".pdf": "application/pdf", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
    res.type(mimeTypes[extension] || "application/octet-stream");
    res.set("Content-Disposition", `inline; filename="POD-${shipment.shipment_number}${extension}"`);
    res.set("Cache-Control", "private, max-age=300");
    return res.sendFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return res.status(404).json({ success: false, message: "POD file is missing from the server" });
    console.error("POD view error:", error);
    return res.status(500).json({ success: false, message: "Failed to open POD file" });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const allowedTransitions = {
      IN_TRANSIT: ["OUT_FOR_DELIVERY"],
      OUT_FOR_DELIVERY: ["DELIVERED"],
      DELIVERED: ["POD_UPLOADED"],
      POD_UPLOADED: ["COMPLETED"],
    };

    const driver = req.user?.role === "driver" ? await Driver.findOne({ user_id: req.user.id }) : null;
    if (req.user?.role === "driver" && !driver) return res.status(403).json({ success: false, message: "Driver login is not linked to a fleet driver" });

    const filter = {
      _id: id,
      ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }),
      ...(driver ? { driver_id: driver._id } : {}),
    };

    const shipment = await Shipment.findOne(filter);
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found" });

    if (!allowedTransitions[shipment.current_status]?.includes(status)) {
      return res.status(409).json({ success: false, message: `Invalid delivery transition: ${shipment.current_status} -> ${status}` });
    }

    if (status === "POD_UPLOADED" && !isValidPodReference(shipment.pod_url)) {
      return res.status(409).json({ success: false, message: "Upload a valid POD file before changing status" });
    }
    if (status === "COMPLETED" && !isValidPodReference(shipment.pod_url)) {
      return res.status(409).json({ success: false, message: "A valid POD file is required before completing delivery" });
    }

    shipment.current_status = status;
    await shipment.save();

    await ShipmentTracking.create({
      shipment_id: id,
      status,
      location: shipment.destination || null,
      remarks: remarks || `Delivery status changed to ${status}`,
    });

    if (status === "DELIVERED") {
      await Trip.updateOne({ shipment_id: shipment._id, organization_id: shipment.organization_id }, { status: "Delivered", end_date: new Date() });
    }

    if (status === "COMPLETED") {
      await Promise.all([
        shipment.vehicle_id ? Vehicle.updateOne({ _id: shipment.vehicle_id, organization_id: shipment.organization_id }, { status: "AVAILABLE" }) : Promise.resolve(),
        shipment.driver_id ? Driver.updateOne({ _id: shipment.driver_id, organization_id: shipment.organization_id }, { status: "AVAILABLE" }) : Promise.resolve(),
        Trip.updateOne({ shipment_id: shipment._id, organization_id: shipment.organization_id }, { status: "Completed", end_date: new Date() }),
        ShipmentAssignment.updateOne({ shipment_id: shipment._id, organization_id: shipment.organization_id }, { status: "RELEASED", released_at: new Date() }),
      ]);

      await Notification.create({
        user_id: null,
        organization_id: shipment.organization_id,
        type: "SUCCESS",
        title: `Shipment completed: ${shipment.shipment_number}`,
        message: "Delivery is closed and assigned fleet has been released.",
        link: "/dashboard",
      });

      if (shipment.customer_id) {
        await Notification.create({
          user_id: shipment.customer_id,
          organization_id: null,
          type: "SUCCESS",
          title: `Shipment completed: ${shipment.shipment_number}`,
          message: "Your shipment delivery has been completed.",
          link: "/dashboard/shipments/all",
        });
      }
    }

    res.json({ success: true, message: "Delivery status updated", data: shipment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update delivery status", error: error.message });
  }
};
