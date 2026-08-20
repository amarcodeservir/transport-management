import ShipmentCharge from "../model/ShipmentCharge.js";
import { findScopedShipment } from "../utils/shipmentAccess.js";

export const saveCharges = async (req, res) => {
  try {
    const {
      shipment_id,
      freight_charge = 0,
      loading_charge = 0,
      unloading_charge = 0,
      fuel_surcharge = 0,
      insurance_charge = 0,
      tax_amount = 0,
      discount_amount = 0,
      other_charge = 0,
    } = req.body;

    if (!shipment_id || !(await findScopedShipment(req, shipment_id))) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const total_amount =
      Number(freight_charge) +
      Number(loading_charge) +
      Number(unloading_charge) +
      Number(fuel_surcharge) +
      Number(insurance_charge) +
      Number(tax_amount) +
      Number(other_charge) -
      Number(discount_amount);

    const result = await ShipmentCharge.create({
      shipment_id,
      freight_charge,
      loading_charge,
      unloading_charge,
      fuel_surcharge,
      insurance_charge,
      tax_amount,
      discount_amount,
      other_charge,
    });

    res.status(201).json({
      message: "Charges saved successfully",
      id: result.id,
      total_amount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save charges",
      error: error.message,
    });
  }
};

export const getCharges = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    if (!(await findScopedShipment(req, shipmentId))) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const charges = await ShipmentCharge.find({ shipment_id: shipmentId });
    res.json({ charges });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch charges",
      error: error.message,
    });
  }
};

export const updateCharges = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    if (!(await findScopedShipment(req, shipmentId))) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const {
      freight_charge = 0,
      loading_charge = 0,
      unloading_charge = 0,
      fuel_surcharge = 0,
      insurance_charge = 0,
      tax_amount = 0,
      discount_amount = 0,
      other_charge = 0,
    } = req.body;

    const total_amount =
      Number(freight_charge) +
      Number(loading_charge) +
      Number(unloading_charge) +
      Number(fuel_surcharge) +
      Number(insurance_charge) +
      Number(tax_amount) +
      Number(other_charge) -
      Number(discount_amount);

    let charge = await ShipmentCharge.findOne({ shipment_id: shipmentId });
    if (!charge) {
      charge = new ShipmentCharge({ shipment_id: shipmentId });
    }

    charge.freight_charge = freight_charge;
    charge.loading_charge = loading_charge;
    charge.unloading_charge = unloading_charge;
    charge.fuel_surcharge = fuel_surcharge;
    charge.insurance_charge = insurance_charge;
    charge.tax_amount = tax_amount;
    charge.discount_amount = discount_amount;
    charge.other_charge = other_charge;
    await charge.save();

    res.json({
      message: "Charges updated successfully",
      total_amount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update charges",
      error: error.message,
    });
  }
};
