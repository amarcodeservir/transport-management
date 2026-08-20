import ShipmentItem from "../model/ShipmentItem.js";
import { findScopedShipment } from "../utils/shipmentAccess.js";

export const createItem = async (req, res) => {
  try {
    const { shipment_id, item_name, quantity, declared_value, weight } = req.body;

    if (!shipment_id || !item_name) {
      return res.status(400).json({ message: "shipment_id and item_name are required" });
    }

    if (!(await findScopedShipment(req, shipment_id))) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const item = await ShipmentItem.create({
      shipment_id,
      item_name,
      quantity: quantity || 1,
      declared_value: declared_value || 0,
      weight: weight || 0,
    });

    res.status(201).json({ message: "Item created successfully", id: item.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to create item", error: error.message });
  }
};

export const getItems = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    if (!(await findScopedShipment(req, shipmentId))) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const items = await ShipmentItem.find({ shipment_id: shipmentId }).sort({ created_at: -1 });
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch items", error: error.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, quantity, declared_value, weight } = req.body;

    const item = await ShipmentItem.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (!(await findScopedShipment(req, item.shipment_id))) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.item_name = item_name || item.item_name;
    item.quantity = quantity !== undefined ? quantity : item.quantity;
    item.declared_value = declared_value !== undefined ? declared_value : item.declared_value;
    item.weight = weight !== undefined ? weight : item.weight;
    await item.save();

    res.json({ message: "Item updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update item", error: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await ShipmentItem.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (!(await findScopedShipment(req, item.shipment_id))) {
      return res.status(404).json({ message: "Item not found" });
    }

    await ShipmentItem.deleteOne({ _id: id });
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete item", error: error.message });
  }
};
