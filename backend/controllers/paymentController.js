import Payment from "../model/Payment.js";
import Invoice from "../model/Invoice.js";

const today = () => new Date().toISOString().slice(0, 10);
const amount = (v) => Number.parseFloat(v || 0) || 0;

const refreshInvoiceStatus = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return;

  const completedPayments = await Payment.find({ invoice_id: invoiceId, status: "COMPLETED" });
  const paid = completedPayments.reduce((sum, p) => sum + amount(p.amount), 0);

  invoice.status = paid >= amount(invoice.total_amount) - 0.01 ? "PAID" : "ISSUED";
  await invoice.save();
};

export const getPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    const payments = await Payment.find(filter)
      .populate({
        path: "invoice_id",
        select: "invoice_number total_amount shipment_id",
        populate: {
          path: "shipment_id",
          select: "shipment_number tracking_number",
        },
      })
      .sort({ payment_date: -1, _id: -1 });

    const rows = payments.map((p) => {
      const doc = p.toJSON();
      const inv = p.invoice_id;
      const shipment = inv?.shipment_id;

      return {
        ...doc,
        invoice_number: inv?.invoice_number || null,
        invoice_total: inv?.total_amount || null,
        shipment_number: shipment?.shipment_number || null,
        tracking_number: shipment?.tracking_number || null,
      };
    });

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch payments", error: error.message });
  }
};

export const getPaymentInvoices = async (req, res) => {
  try {
    const filter = { status: { $ne: "CANCELLED" } };

    if (req.user?.role === "customer") {
      filter.organization_id = req.user?.organization_id;
      filter.customer_id = req.user.id;
      filter.status = { $in: ["ISSUED", "PAID"] };
    } else if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    const invoices = await Invoice.find(filter)
      .populate("shipment_id", "shipment_number tracking_number")
      .sort({ created_at: -1 });

    const rows = await Promise.all(
      invoices.map(async (i) => {
        const completedPayments = await Payment.find({ invoice_id: i._id, status: "COMPLETED" });
        const paid_amount = completedPayments.reduce((sum, p) => sum + amount(p.amount), 0);
        const total = amount(i.total_amount);

        return {
          invoice_id: i.id,
          id: i.id,
          shipment_id: i.shipment_id?._id || null,
          invoice_number: i.invoice_number,
          total_amount: total,
          invoice_date: i.invoice_date,
          due_date: i.due_date,
          status: i.status,
          shipment_number: i.shipment_id?.shipment_number || null,
          tracking_number: i.shipment_id?.tracking_number || null,
          paid_amount,
          balance_amount: Math.max(0, total - paid_amount),
        };
      })
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch payable invoices", error: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { invoice_id, amount: paidAmount, payment_date, payment_method, reference_number, notes } = req.body;

    const invoiceScope = {
      _id: invoice_id,
      ...(req.user?.role === "super_admin"
        ? {}
        : req.user?.role === "customer"
          ? { organization_id: req.user?.organization_id, customer_id: req.user.id, status: { $in: ["ISSUED", "PAID"] } }
          : { organization_id: req.user?.organization_id }),
    };

    const invoice = await Invoice.findOne(invoiceScope);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const paid = amount(paidAmount);
    if (paid <= 0) return res.status(400).json({ success: false, message: "Payment amount must be greater than zero" });
    if (!payment_method) return res.status(400).json({ success: false, message: "Payment method is required" });
    if (req.user?.role === "customer" && !String(reference_number || "").trim()) {
      return res.status(400).json({ success: false, message: "Transaction reference is required" });
    }

    const completedPayments = await Payment.find({ invoice_id, status: "COMPLETED" });
    const existingPaid = completedPayments.reduce((sum, p) => sum + amount(p.amount), 0);
    const balance = amount(invoice.total_amount) - existingPaid;

    if (balance <= 0.01) return res.status(409).json({ success: false, message: "Invoice is already fully paid" });
    if (paid > balance + 0.01) {
      return res.status(400).json({ success: false, message: `Payment cannot exceed remaining balance ₹${Math.max(0, balance).toFixed(2)}` });
    }

    const payment = await Payment.create({
      invoice_id,
      organization_id: invoice.organization_id,
      amount: paid,
      payment_date: payment_date || today(),
      payment_method,
      reference_number: reference_number || null,
      notes: notes || null,
      status: "COMPLETED",
    });

    const newBalance = balance - paid;
    if (newBalance <= 0.01) {
      invoice.status = "PAID";
      await invoice.save();
    }

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment,
      balance_amount: Math.max(0, newBalance),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to record payment", error: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
      ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }),
    };

    const payment = await Payment.findOne(filter);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    const invoice = await Invoice.findById(payment.invoice_id);
    const newAmount = amount(req.body.amount);
    if (!invoice || newAmount <= 0) return res.status(400).json({ success: false, message: "Valid payment amount is required" });

    const otherPayments = await Payment.find({ invoice_id: payment.invoice_id, status: "COMPLETED", _id: { $ne: payment._id } });
    const otherPaid = otherPayments.reduce((sum, p) => sum + amount(p.amount), 0);
    const balance = amount(invoice.total_amount) - otherPaid;

    if (newAmount > balance + 0.01) {
      return res.status(400).json({ success: false, message: `Payment cannot exceed remaining balance ₹${Math.max(0, balance).toFixed(2)}` });
    }

    payment.amount = newAmount;
    if (req.body.payment_date) payment.payment_date = req.body.payment_date;
    if (req.body.payment_method) payment.payment_method = req.body.payment_method;
    payment.reference_number = req.body.reference_number || null;
    payment.notes = req.body.notes || null;
    await payment.save();

    await refreshInvoiceStatus(payment.invoice_id);

    res.json({ success: true, message: "Payment updated successfully", data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update payment", error: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
      ...(req.user?.role === "super_admin" ? {} : { organization_id: req.user?.organization_id }),
    };

    const payment = await Payment.findOne(filter);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    const invoiceId = payment.invoice_id;
    await Payment.deleteOne({ _id: payment._id });

    await refreshInvoiceStatus(invoiceId);

    res.json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete payment", error: error.message });
  }
};
