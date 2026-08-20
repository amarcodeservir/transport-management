import ShipmentParty from "../model/ShipmentParty.js";
import { findScopedShipment } from "../utils/shipmentAccess.js";

export const createParty = async (req, res) => {
  try {
    const { shipment_id, party_type, name, company_name, mobile, email, address, city, state, pincode, gstin } = req.body;

    if (!shipment_id || !party_type || !name) {
      return res.status(400).json({ message: "shipment_id, party_type and name are required" });
    }

    const shipment = await findScopedShipment(req, shipment_id);
    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const party = await ShipmentParty.create({
      shipment_id,
      party_type: String(party_type).toLowerCase() === "consignee" || String(party_type).toLowerCase() === "receiver" ? "receiver" : "sender",
      name,
      company_name: company_name || null,
      mobile: mobile || null,
      email: email || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      gstin: gstin || null,
    });

    res.status(201).json({ message: "Party created successfully", id: party.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to create party", error: error.message });
  }
};

export const getShipmentParties = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const shipment = await findScopedShipment(req, shipmentId);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    const parties = await ShipmentParty.find({ shipment_id: shipmentId });
    res.json({ parties });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch parties", error: error.message });
  }
};

export const updateParty = async (req, res) => {
  try {
    const { id } = req.params;
    const { party_type, name, company_name, mobile, email, address, city, state, pincode, gstin } = req.body;

    const party = await ShipmentParty.findById(id);
    if (!party) return res.status(404).json({ message: "Party not found" });

    if (!(await findScopedShipment(req, party.shipment_id))) {
      return res.status(404).json({ message: "Party not found" });
    }

    if (party_type) party.party_type = String(party_type).toLowerCase() === "consignee" || String(party_type).toLowerCase() === "receiver" ? "receiver" : "sender";
    if (name) party.name = name;
    party.company_name = company_name || party.company_name;
    party.mobile = mobile || party.mobile;
    party.email = email || party.email;
    party.address = address || party.address;
    party.city = city || party.city;
    party.state = state || party.state;
    party.pincode = pincode || party.pincode;
    party.gstin = gstin || party.gstin;

    await party.save();
    res.json({ message: "Party updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update party", error: error.message });
  }
};

export const deleteParty = async (req, res) => {
  try {
    const { id } = req.params;

    const party = await ShipmentParty.findById(id);
    if (!party) return res.status(404).json({ message: "Party not found" });

    if (!(await findScopedShipment(req, party.shipment_id))) {
      return res.status(404).json({ message: "Party not found" });
    }

    await ShipmentParty.deleteOne({ _id: id });
    res.json({ message: "Party deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete party", error: error.message });
  }
};
