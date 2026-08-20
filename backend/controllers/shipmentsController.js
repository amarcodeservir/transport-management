import Shipment from "../model/Shipment.js";
import ShipmentParty from "../model/ShipmentParty.js";
import ShipmentPackage from "../model/ShipmentPackage.js";
import ShipmentItem from "../model/ShipmentItem.js";
import ShipmentCharge from "../model/ShipmentCharge.js";
import ShipmentTracking from "../model/ShipmentTracking.js";
import Vehicle from "../model/Vehicle.js";
import Driver from "../model/Driver.js";
import User from "../model/User.js";
import { checkSubscriptionLimit } from "../utils/subscriptionLimits.js";

const toChargeAmount = (value) => Math.max(0, Number(value) || 0);
const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const calculateChargeTotal = (charge = {}) => roundCurrency(Math.max(
  0,
  toChargeAmount(charge.freight_charge)
    + toChargeAmount(charge.loading_charge)
    + toChargeAmount(charge.unloading_charge)
    + toChargeAmount(charge.fuel_surcharge)
    + toChargeAmount(charge.insurance_charge)
    + toChargeAmount(charge.other_charge)
    + toChargeAmount(charge.tax_amount)
    - toChargeAmount(charge.discount_amount)
));

const hasChargeAmount = (charge = {}) => [
  "freight_charge", "loading_charge", "unloading_charge", "fuel_surcharge",
  "insurance_charge", "other_charge", "discount_amount", "tax_amount"
].some((field) => toChargeAmount(charge[field]) > 0);

/*
|--------------------------------------------------------------------------
| CREATE SHIPMENT
|--------------------------------------------------------------------------
| Shipment + Sender + Receiver + Packages + Items + Charges + Tracking
*/
export const createShipment = async (req, res) => {
  try {
    const body = req.body || {};
    const {
      shipment_number,
      tracking_number,
      lr_number,
      customer_id: requestedCustomerId,
      organization_id: requestedOrganizationId,
      ref_number,
      indent_number,
      booking_date,
      shipment_date,
      pickup_date,
      weight,
      shipment_type,
      service_type,
      mode,
      payment_mode,
      origin,
      destination,
      expected_delivery_date,
      remarks,
      vehicle_id,
      driver_id,
      sender,
      receiver,
      packages = [],
      items = [],
      charges = []
    } = body;

    const tenantOrganizationId = req.user?.role === "super_admin"
      ? requestedOrganizationId || null
      : req.user?.organization_id || null;
    const isCustomerBooking = req.user?.role === "customer";
    const customer_id = isCustomerBooking ? req.user.id : requestedCustomerId;

    if (!tenantOrganizationId) {
      return res.status(400).json({ success: false, message: "An active organization is required to create a shipment" });
    }

    const shipmentLimit = await checkSubscriptionLimit(tenantOrganizationId, "monthly_shipments");
    if (!shipmentLimit.allowed) {
      return res.status(shipmentLimit.statusCode).json({ success: false, message: shipmentLimit.message });
    }

    if (!customer_id) {
      return res.status(400).json({ success: false, message: "customer_id is required" });
    }

    if (!booking_date) {
      return res.status(400).json({ success: false, message: "booking_date is required" });
    }

    const hasRequiredPartyDetails = (party) => Boolean(
      party?.name && (party?.mobile || party?.phone) && party?.address
    );
    if (isCustomerBooking && (!origin || !destination)) {
      return res.status(400).json({ success: false, message: "Origin and destination are required" });
    }
    if (isCustomerBooking && (!hasRequiredPartyDetails(sender) || !hasRequiredPartyDetails(receiver))) {
      return res.status(400).json({ success: false, message: "Consignor and consignee name, phone and address are required" });
    }

    const requestedChargeRows = Array.isArray(charges) ? charges : (charges ? [charges] : []);
    if (isCustomerBooking && requestedChargeRows.some((charge) => charge && hasChargeAmount(charge))) {
      return res.status(403).json({ success: false, message: "Shipment charges can be added only by the organization admin" });
    }

    const customer = await User.findOne({
      _id: customer_id,
      role: "customer",
      organization_id: tenantOrganizationId,
      status: { $regex: /^active$/i }
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Active customer not found in this organization" });
    }

    const normalizedShipmentNumber = shipment_number || ref_number || `SHP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const normalizedTrackingNumber = tracking_number || normalizedShipmentNumber;

    const hasVehicle = vehicle_id !== undefined && vehicle_id !== null && vehicle_id !== "";
    const hasDriver = driver_id !== undefined && driver_id !== null && driver_id !== "";

    if (isCustomerBooking && (hasVehicle || hasDriver)) {
      return res.status(403).json({ success: false, message: "Customers cannot assign vehicles or drivers" });
    }
    if (hasVehicle || hasDriver) {
      return res.status(409).json({ success: false, message: "Create the shipment first, approve it, then assign fleet from the Assignments step" });
    }

    const existingShipment = await Shipment.findOne({ shipment_number: normalizedShipmentNumber });
    if (existingShipment) {
      return res.status(409).json({ success: false, message: "Shipment number already exists" });
    }

    const shipment = await Shipment.create({
      shipment_number: normalizedShipmentNumber,
      tracking_number: normalizedTrackingNumber,
      lr_number: lr_number || null,
      customer_id,
      organization_id: tenantOrganizationId,
      ref_number: ref_number || null,
      indent_number: indent_number || null,
      booking_date,
      shipment_date: shipment_date || null,
      weight: weight || 0,
      pickup_date: pickup_date || null,
      shipment_type: shipment_type || "Domestic",
      service_type: service_type || "Standard",
      mode: mode || "ROAD",
      payment_mode: payment_mode || "PREPAID",
      origin: origin || null,
      destination: destination || null,
      expected_delivery_date: expected_delivery_date || null,
      current_status: "PENDING",
      remarks: remarks || null,
      vehicle_id: null,
      driver_id: null,
    });

    const shipmentId = shipment._id;

    // Save Sender & Receiver
    if (sender) {
      await ShipmentParty.create({
        shipment_id: shipmentId,
        party_type: "sender",
        name: sender.name || null,
        company_name: sender.company_name || null,
        gstin: sender.gstin || null,
        mobile: sender.mobile || null,
        phone: sender.phone || null,
        email: sender.email || null,
        address: sender.address || null,
        city: sender.city || null,
        state: sender.state || null,
        pincode: sender.pincode || null,
      });
    }

    if (receiver) {
      await ShipmentParty.create({
        shipment_id: shipmentId,
        party_type: "receiver",
        name: receiver.name || null,
        company_name: receiver.company_name || null,
        gstin: receiver.gstin || null,
        mobile: receiver.mobile || null,
        phone: receiver.phone || null,
        email: receiver.email || null,
        address: receiver.address || null,
        city: receiver.city || null,
        state: receiver.state || null,
        pincode: receiver.pincode || null,
      });
    }

    // Packages
    if (Array.isArray(packages) && packages.length > 0) {
      await Promise.all(packages.map((pkg) => ShipmentPackage.create({
        shipment_id: shipmentId,
        package_type: pkg.package_type || null,
        quantity: pkg.quantity || 1,
        weight: pkg.weight || 0,
        length: pkg.length || 0,
        width: pkg.width || 0,
        height: pkg.height || 0,
      })));
    }

    // Items
    if (Array.isArray(items) && items.length > 0) {
      await Promise.all(items.map((item) => ShipmentItem.create({
        shipment_id: shipmentId,
        item_name: item.item_name || null,
        quantity: item.quantity || 1,
        declared_value: item.declared_value || 0,
        weight: item.weight || 0,
      })));
    }

    // Charges
    const chargeObj = requestedChargeRows[0] || {};
    await ShipmentCharge.create({
      shipment_id: shipmentId,
      freight_charge: toChargeAmount(chargeObj.freight_charge),
      loading_charge: toChargeAmount(chargeObj.loading_charge),
      unloading_charge: toChargeAmount(chargeObj.unloading_charge),
      fuel_surcharge: toChargeAmount(chargeObj.fuel_surcharge),
      insurance_charge: toChargeAmount(chargeObj.insurance_charge),
      other_charge: toChargeAmount(chargeObj.other_charge),
      tax_amount: toChargeAmount(chargeObj.tax_amount),
      discount_amount: toChargeAmount(chargeObj.discount_amount),
    });

    // Tracking initial log
    await ShipmentTracking.create({
      shipment_id: shipmentId,
      status: "PENDING",
      remarks: "Shipment created",
    });

    res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      shipment_id: shipment.id,
      shipment_number: normalizedShipmentNumber,
      tracking_number: normalizedTrackingNumber,
    });
  } catch (error) {
    console.error("Create Shipment Error:", error);
    res.status(500).json({ success: false, message: "Failed to create shipment", error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| GET ALL SHIPMENTS
|--------------------------------------------------------------------------
*/
export const getAllShipments = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role === "customer") {
      filter.customer_id = req.user.id;
    } else if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    if (req.query.status) {
      filter.current_status = req.query.status.toUpperCase();
    }

    const shipments = await Shipment.find(filter)
      .populate("customer_id", "name company_name email phone")
      .populate("vehicle_id", "vehicle_number vehicle_type")
      .populate("driver_id", "name mobile")
      .sort({ created_at: -1 });

    const data = await Promise.all(shipments.map(async (s) => {
      const doc = s.toJSON();
      const sender = await ShipmentParty.findOne({ shipment_id: s._id, party_type: "sender" });
      const receiver = await ShipmentParty.findOne({ shipment_id: s._id, party_type: "receiver" });
      const charges = await ShipmentCharge.findOne({ shipment_id: s._id });

      return {
        ...doc,
        Customer: s.customer_id,
        Vehicle: s.vehicle_id,
        Driver: s.driver_id,
        sender_name: sender?.name || null,
        receiver_name: receiver?.name || null,
        total_charges: charges ? calculateChargeTotal(charges) : 0,
      };
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error("Get All Shipments Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch shipments", error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| GET SHIPMENT DETAILS BY ID
|--------------------------------------------------------------------------
*/
export const getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id };

    if (req.user?.role === "customer") {
      filter.customer_id = req.user.id;
    } else if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    const shipment = await Shipment.findOne(filter)
      .populate("customer_id", "name company_name email phone")
      .populate("vehicle_id", "vehicle_number vehicle_type")
      .populate("driver_id", "name mobile");

    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    const [parties, packages, items, charge, trackingHistory] = await Promise.all([
      ShipmentParty.find({ shipment_id: shipment._id }),
      ShipmentPackage.find({ shipment_id: shipment._id }),
      ShipmentItem.find({ shipment_id: shipment._id }),
      ShipmentCharge.findOne({ shipment_id: shipment._id }),
      ShipmentTracking.find({ shipment_id: shipment._id }).sort({ tracking_date: -1 }),
    ]);

    const sender = parties.find((p) => p.party_type === "sender") || null;
    const receiver = parties.find((p) => p.party_type === "receiver") || null;

    res.json({
      success: true,
      data: {
        ...shipment.toJSON(),
        Customer: shipment.customer_id,
        Vehicle: shipment.vehicle_id,
        Driver: shipment.driver_id,
        sender,
        receiver,
        packages,
        items,
        charges: charge ? [charge] : [],
        trackingHistory,
      },
    });
  } catch (error) {
    console.error("Get Shipment By Id Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch shipment details", error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE SHIPMENT
|--------------------------------------------------------------------------
*/
export const updateShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id };
    if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    const shipment = await Shipment.findOne(filter);
    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    const allowedFields = [
      "origin", "destination", "weight", "shipment_type", "service_type",
      "mode", "payment_mode", "expected_delivery_date", "remarks", "lr_number"
    ];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) shipment[key] = req.body[key];
    }

    await shipment.save();
    res.json({ success: true, message: "Shipment updated successfully", data: shipment });
  } catch (error) {
    console.error("Update Shipment Error:", error);
    res.status(500).json({ success: false, message: "Failed to update shipment", error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| APPROVE SHIPMENT (PENDING -> UNASSIGNED)
|--------------------------------------------------------------------------
*/
export const approveShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id };
    if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    const shipment = await Shipment.findOne(filter);
    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    if (shipment.current_status !== "PENDING") {
      return res.status(409).json({ success: false, message: "Only pending shipments can be approved" });
    }

    shipment.current_status = "UNASSIGNED";
    await shipment.save();

    await ShipmentTracking.create({
      shipment_id: shipment._id,
      status: "UNASSIGNED",
      remarks: "Shipment approved by admin, ready for assignment",
    });

    res.json({ success: true, message: "Shipment approved successfully", data: shipment });
  } catch (error) {
    console.error("Approve Shipment Error:", error);
    res.status(500).json({ success: false, message: "Failed to approve shipment", error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| ASSIGN SHIPMENT (UNASSIGNED -> ASSIGNED)
|--------------------------------------------------------------------------
*/
export const assignShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_id, driver_id, remarks } = req.body;

    if (!vehicle_id || !driver_id) {
      return res.status(400).json({ success: false, message: "vehicle_id and driver_id are required" });
    }

    const filter = { _id: id };
    if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    const shipment = await Shipment.findOne(filter);
    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    shipment.vehicle_id = vehicle_id;
    shipment.driver_id = driver_id;
    shipment.current_status = "ASSIGNED";
    await shipment.save();

    await Vehicle.updateOne({ _id: vehicle_id }, { status: "ASSIGNED" });
    await Driver.updateOne({ _id: driver_id }, { status: "ASSIGNED" });

    await ShipmentTracking.create({
      shipment_id: shipment._id,
      status: "ASSIGNED",
      remarks: remarks || "Shipment assigned to vehicle and driver",
    });

    res.json({ success: true, message: "Shipment assigned successfully", data: shipment });
  } catch (error) {
    console.error("Assign Shipment Error:", error);
    res.status(500).json({ success: false, message: "Failed to assign shipment", error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE SHIPMENT STATUS
|--------------------------------------------------------------------------
*/
export const updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const filter = { _id: id };
    if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    const shipment = await Shipment.findOne(filter);
    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    const newStatus = String(status).toUpperCase();
    shipment.current_status = newStatus;
    await shipment.save();

    await ShipmentTracking.create({
      shipment_id: shipment._id,
      status: newStatus,
      remarks: remarks || `Status updated to ${newStatus}`,
    });

    res.json({ success: true, message: "Shipment status updated", data: shipment });
  } catch (error) {
    console.error("Update Shipment Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update shipment status", error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE SHIPMENT
|--------------------------------------------------------------------------
*/
export const deleteShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id };
    if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    const shipment = await Shipment.findOne(filter);
    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    await Promise.all([
      ShipmentParty.deleteMany({ shipment_id: id }),
      ShipmentPackage.deleteMany({ shipment_id: id }),
      ShipmentItem.deleteMany({ shipment_id: id }),
      ShipmentCharge.deleteMany({ shipment_id: id }),
      ShipmentTracking.deleteMany({ shipment_id: id }),
      Shipment.deleteOne({ _id: id }),
    ]);

    res.json({ success: true, message: "Shipment deleted successfully" });
  } catch (error) {
    console.error("Delete Shipment Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete shipment", error: error.message });
  }
};
