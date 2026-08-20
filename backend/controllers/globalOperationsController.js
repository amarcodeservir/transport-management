import Shipment from "../model/Shipment.js";
import Organization from "../model/Organization.js";

export const getGlobalOperations = async (req, res) => {
  try {
    const { organization_id, status, search } = req.query;
    const filter = {};

    if (organization_id) filter.organization_id = organization_id;
    if (status) filter.current_status = status;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ shipment_number: regex }, { tracking_number: regex }];
    }

    const shipments = await Shipment.find(filter)
      .populate("organization_id", "name code")
      .populate("vehicle_id", "vehicle_number")
      .populate("driver_id", "name")
      .sort({ updated_at: -1 })
      .limit(500);

    const rows = shipments.map((s) => {
      const doc = s.toJSON();
      return {
        ...doc,
        organization_id: s.organization_id?._id?.toString() || null,
        vehicle_id: s.vehicle_id?._id?.toString() || null,
        driver_id: s.driver_id?._id?.toString() || null,
        organization_name: s.organization_id?.name || null,
        vehicle_number: s.vehicle_id?.vehicle_number || null,
        driver_name: s.driver_id?.name || null,
      };
    });

    const organizations = await Organization.find().select("name code status").sort({ name: 1 });

    const summaryFilter = {};
    if (organization_id) summaryFilter.organization_id = organization_id;
    if (search) {
      const regex = new RegExp(search, "i");
      summaryFilter.$or = [{ shipment_number: regex }, { tracking_number: regex }];
    }

    const summaryShipments = await Shipment.find(summaryFilter).select("current_status");
    const total = summaryShipments.length;
    const pending = summaryShipments.filter((s) => s.current_status === "PENDING").length;
    const assigned = summaryShipments.filter((s) => s.current_status === "ASSIGNED").length;
    const in_transit = summaryShipments.filter((s) => s.current_status === "IN_TRANSIT").length;
    const out_for_delivery = summaryShipments.filter((s) => s.current_status === "OUT_FOR_DELIVERY").length;
    const delivered = summaryShipments.filter((s) => ["DELIVERED", "POD_UPLOADED", "COMPLETED"].includes(s.current_status)).length;

    res.json({
      success: true,
      data: {
        rows,
        organizations,
        summary: { total, pending, assigned, in_transit, out_for_delivery, delivered },
      },
    });
  } catch (error) {
    console.error("Global operations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch global operations", error: error.message });
  }
};
