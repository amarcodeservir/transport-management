import Shipment from "../model/Shipment.js";
import Invoice from "../model/Invoice.js";
import Payment from "../model/Payment.js";

export const getReportSummary = async (req, res) => {
  try {
    const fromDate = req.query.from ? new Date(req.query.from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = req.query.to ? new Date(req.query.to) : new Date();
    toDate.setHours(23, 59, 59, 999);

    const filter = { created_at: { $gte: fromDate, $lte: toDate } };
    if (req.user?.role !== "super_admin") {
      filter.organization_id = req.user?.organization_id;
    }

    const shipments = await Shipment.find(filter);

    const total_shipments = shipments.length;
    const total_weight = shipments.reduce((sum, s) => sum + (s.weight || 0), 0);
    const delivered_shipments = shipments.filter((s) => ["DELIVERED", "POD_UPLOADED", "COMPLETED"].includes(s.current_status)).length;
    const in_transit_shipments = shipments.filter((s) => s.current_status === "IN_TRANSIT").length;
    const active_shipments = shipments.filter((s) => ["PENDING", "UNASSIGNED", "ASSIGNED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.current_status)).length;

    // Status aggregation
    const statusMap = {};
    shipments.forEach((s) => {
      const st = s.current_status || "UNKNOWN";
      statusMap[st] = (statusMap[st] || 0) + 1;
    });
    const statuses = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // Routes aggregation
    const routeMap = {};
    shipments.forEach((s) => {
      const key = `${s.origin || "-"}|${s.destination || "-"}`;
      if (!routeMap[key]) {
        routeMap[key] = { origin: s.origin || "-", destination: s.destination || "-", shipments: 0, delivered: 0 };
      }
      routeMap[key].shipments += 1;
      if (["DELIVERED", "POD_UPLOADED", "COMPLETED"].includes(s.current_status)) {
        routeMap[key].delivered += 1;
      }
    });
    const routes = Object.values(routeMap).sort((a, b) => b.shipments - a.shipments).slice(0, 8);

    // Invoice summary
    const invoiceFilter = req.user?.role !== "super_admin" ? { organization_id: req.user?.organization_id } : {};
    const invoices = await Invoice.find(invoiceFilter);
    const invoice_count = invoices.length;
    const invoiced_amount = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
    const paid_invoice_amount = invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + (i.total_amount || 0), 0);

    // Payments summary
    const paymentFilter = { payment_date: { $gte: fromDate, $lte: toDate } };
    if (req.user?.role !== "super_admin") paymentFilter.organization_id = req.user?.organization_id;
    const payments = await Payment.find(paymentFilter);
    const collected_amount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      success: true,
      data: {
        range: { from: fromDate.toISOString().slice(0, 10), to: toDate.toISOString().slice(0, 10) },
        kpis: {
          total_shipments,
          total_weight,
          delivered_shipments,
          in_transit_shipments,
          active_shipments,
          invoice_count,
          invoiced_amount,
          paid_invoice_amount,
          collected_amount,
        },
        statuses,
        routes,
      },
    });
  } catch (error) {
    console.error("Reports error:", error);
    res.status(500).json({ success: false, message: "Failed to generate report", error: error.message });
  }
};
