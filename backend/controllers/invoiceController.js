import Invoice from "../model/Invoice.js";
import ShipmentCharge from "../model/ShipmentCharge.js";
import Shipment from "../model/Shipment.js";
import Organization from "../model/Organization.js";
import Maintenance from "../model/Maintenance.js";
import { renderInvoiceTemplate } from "../template/invoiceTemplate.js";

const money = (v) => Number.parseFloat(v || 0) || 0;
const dateToday = () => new Date().toISOString().slice(0, 10);

const getInvoiceReadFilter = (req, invoiceId = null) => {
  const filter = {};
  if (invoiceId) filter._id = invoiceId;

  if (req.user?.role === "customer") {
    filter.organization_id = req.user?.organization_id;
    filter.customer_id = req.user.id;
  } else if (req.user?.role !== "super_admin") {
    filter.organization_id = req.user?.organization_id;
  }

  return filter;
};

const getShipmentMaintenanceSummary = async (shipment) => {
  if (!shipment?.vehicle_id) return { maintenanceServices: 0, maintenanceCharge: 0 };

  const startDate = shipment.shipment_date || shipment.booking_date;
  const endDate = shipment.updated_at || new Date();

  const maintenanceRecords = await Maintenance.find({
    vehicle_id: shipment.vehicle_id,
    service_date: { $gte: startDate, $lte: endDate },
  });

  const maintenanceCharge = maintenanceRecords.reduce((sum, m) => sum + money(m.cost), 0);

  return {
    maintenanceServices: maintenanceRecords.length,
    maintenanceCharge,
  };
};

export const getInvoices = async (req, res) => {
  try {
    const filter = getInvoiceReadFilter(req);
    const invoices = await Invoice.find(filter)
      .populate("shipment_id", "shipment_number tracking_number origin destination customer_id")
      .sort({ created_at: -1 });

    const data = invoices.map((inv) => {
      const doc = inv.toJSON();
      const s = inv.shipment_id;
      return {
        ...doc,
        shipment_number: s?.shipment_number || null,
        tracking_number: s?.tracking_number || null,
        origin: s?.origin || null,
        destination: s?.destination || null,
        shipment_customer_id: s?.customer_id || null,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch invoices", error: error.message });
  }
};

export const getInvoiceShipments = async (req, res) => {
  try {
    const filter = { current_status: "COMPLETED" };
    if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    const existingInvoices = await Invoice.find({ status: { $in: ["DRAFT", "ISSUED", "PAID"] } }).select("shipment_id");
    const existingShipmentIds = new Set(existingInvoices.map((inv) => String(inv.shipment_id)));

    const completedShipments = await Shipment.find(filter).sort({ created_at: -1 });
    const availableShipments = completedShipments.filter((s) => !existingShipmentIds.has(String(s._id)));

    const rows = await Promise.all(
      availableShipments.map(async (s) => {
        const c = (await ShipmentCharge.findOne({ shipment_id: s._id }))?.toJSON() || {};
        const { maintenanceCharge, maintenanceServices } = await getShipmentMaintenanceSummary(s);

        return {
          shipment_id: s.id,
          id: s.id,
          shipment_number: s.shipment_number,
          tracking_number: s.tracking_number,
          customer_id: s.customer_id,
          organization_id: s.organization_id,
          vehicle_id: s.vehicle_id,
          origin: s.origin,
          destination: s.destination,
          freight_charge: money(c.freight_charge),
          loading_charge: money(c.loading_charge),
          unloading_charge: money(c.unloading_charge),
          fuel_surcharge: money(c.fuel_surcharge),
          insurance_charge: money(c.insurance_charge),
          tax_amount: money(c.tax_amount),
          discount_amount: money(c.discount_amount),
          other_charge: money(c.other_charge),
          maintenance_charge: maintenanceCharge,
          maintenance_services: maintenanceServices,
        };
      })
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch invoice shipments", error: error.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { shipment_id, due_date, tax_amount, discount_amount, notes } = req.body;
    if (!shipment_id) return res.status(400).json({ success: false, message: "Shipment is required" });

    const filter = {
      _id: shipment_id,
      ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }),
    };

    const shipment = await Shipment.findOne(filter);
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found" });

    if (shipment.current_status !== "COMPLETED") {
      return res.status(409).json({ success: false, message: "Invoice can be generated only after delivery closure is completed" });
    }

    const existingInvoice = await Invoice.findOne({ shipment_id, status: { $in: ["DRAFT", "ISSUED", "PAID"] } });
    if (existingInvoice) {
      return res.status(409).json({ success: false, message: "An active invoice already exists for this shipment" });
    }

    const charge = await ShipmentCharge.findOne({ shipment_id });
    const c = charge?.toJSON() || {};
    const { maintenanceCharge } = await getShipmentMaintenanceSummary(shipment);

    const shipmentCharge = money(c.freight_charge) + money(c.loading_charge) + money(c.unloading_charge) + money(c.fuel_surcharge) + money(c.insurance_charge) + money(c.other_charge);
    const subtotal = shipmentCharge + maintenanceCharge;

    if (subtotal <= 0) {
      return res.status(409).json({ success: false, message: "Invoice banane se pehle shipment ya vehicle maintenance charge add karein" });
    }

    const tax = tax_amount === undefined ? money(c.tax_amount) : money(tax_amount);
    const discount = discount_amount === undefined ? money(c.discount_amount) : money(discount_amount);
    const total = Math.max(0, subtotal + tax - discount);

    const invoice = await Invoice.create({
      invoice_number: `INV-${Date.now()}`,
      shipment_id,
      customer_id: shipment.customer_id,
      organization_id: shipment.organization_id,
      invoice_date: dateToday(),
      due_date: due_date || null,
      subtotal,
      maintenance_charge: maintenanceCharge,
      tax_amount: tax,
      discount_amount: discount,
      total_amount: total,
      status: "ISSUED",
      notes: notes || null,
    });

    res.status(201).json({ success: true, message: "Invoice generated successfully", data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate invoice", error: error.message });
  }
};

export const getInvoiceTemplate = async (req, res) => {
  try {
    const filter = getInvoiceReadFilter(req, req.params.id);
    const invoice = await Invoice.findOne(filter)
      .populate("organization_id", "name")
      .populate("shipment_id", "shipment_number tracking_number origin destination booking_date customer_id");

    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const charge = (await ShipmentCharge.findOne({ shipment_id: invoice.shipment_id?._id }))?.toJSON() || {};
    const doc = invoice.toJSON();
    const org = invoice.organization_id;
    const s = invoice.shipment_id;

    const data = {
      ...doc,
      organization_name: org?.name || null,
      shipment_number: s?.shipment_number || null,
      tracking_number: s?.tracking_number || null,
      origin: s?.origin || null,
      destination: s?.destination || null,
      booking_date: s?.booking_date || null,
      shipment_customer_id: s?.customer_id || null,
      freight_charge: money(charge.freight_charge),
      loading_charge: money(charge.loading_charge),
      unloading_charge: money(charge.unloading_charge),
      fuel_surcharge: money(charge.fuel_surcharge),
      insurance_charge: money(charge.insurance_charge),
      other_charge: money(charge.other_charge),
    };

    res.type("html").send(renderInvoiceTemplate(data));
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate invoice template", error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const filter = getInvoiceReadFilter(req, req.params.id);
    const invoice = await Invoice.findOne(filter)
      .populate("organization_id", "name")
      .populate("shipment_id", "shipment_number tracking_number origin destination booking_date customer_id");

    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const charge = (await ShipmentCharge.findOne({ shipment_id: invoice.shipment_id?._id }))?.toJSON() || {};
    const doc = invoice.toJSON();
    const org = invoice.organization_id;
    const s = invoice.shipment_id;

    const data = {
      ...doc,
      organization_name: org?.name || null,
      shipment_number: s?.shipment_number || null,
      tracking_number: s?.tracking_number || null,
      origin: s?.origin || null,
      destination: s?.destination || null,
      booking_date: s?.booking_date || null,
      shipment_customer_id: s?.customer_id || null,
      freight_charge: money(charge.freight_charge),
      loading_charge: money(charge.loading_charge),
      unloading_charge: money(charge.unloading_charge),
      fuel_surcharge: money(charge.fuel_surcharge),
      insurance_charge: money(charge.insurance_charge),
      other_charge: money(charge.other_charge),
    };

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch invoice details", error: error.message });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
      ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }),
    };

    const invoice = await Invoice.findOne(filter);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const allowed = ["DRAFT", "ISSUED", "PAID", "CANCELLED"];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "Invalid invoice status" });
    }

    invoice.status = req.body.status;
    await invoice.save();

    res.json({ success: true, message: "Invoice status updated", data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update invoice status", error: error.message });
  }
};
