import ShipmentPackage from "../model/ShipmentPackage.js";
import { findScopedShipment } from "../utils/shipmentAccess.js";

export const createPackage = async (req, res) => {
  try {
    const { shipment_id, package_type, quantity, weight, length, width, height } = req.body;

    if (!shipment_id || !(await findScopedShipment(req, shipment_id))) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const pkg = await ShipmentPackage.create({
      shipment_id,
      package_type: package_type || null,
      quantity: quantity || 1,
      weight: weight || 0,
      length: length || 0,
      width: width || 0,
      height: height || 0,
    });

    res.status(201).json({ message: "Package created successfully", id: pkg.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to create package", error: error.message });
  }
};

export const getPackages = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    if (!(await findScopedShipment(req, shipmentId))) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const packages = await ShipmentPackage.find({ shipment_id: shipmentId }).sort({ created_at: -1 });
    res.json({ packages });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch packages", error: error.message });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { package_type, quantity, weight, length, width, height } = req.body;

    const pkg = await ShipmentPackage.findById(id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    if (!(await findScopedShipment(req, pkg.shipment_id))) {
      return res.status(404).json({ message: "Package not found" });
    }

    pkg.package_type = package_type || pkg.package_type;
    pkg.quantity = quantity !== undefined ? quantity : pkg.quantity;
    pkg.weight = weight !== undefined ? weight : pkg.weight;
    pkg.length = length !== undefined ? length : pkg.length;
    pkg.width = width !== undefined ? width : pkg.width;
    pkg.height = height !== undefined ? height : pkg.height;
    await pkg.save();

    res.json({ message: "Package updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update package", error: error.message });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const pkg = await ShipmentPackage.findById(id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    if (!(await findScopedShipment(req, pkg.shipment_id))) {
      return res.status(404).json({ message: "Package not found" });
    }

    await ShipmentPackage.deleteOne({ _id: id });
    res.json({ message: "Package deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete package", error: error.message });
  }
};
