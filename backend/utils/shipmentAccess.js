import Shipment from "../model/Shipment.js";

export const shipmentScope = (req, id) => {
  const filter = { _id: id };
  if (req.user?.role === "customer") {
    filter.customer_id = req.user.id;
  } else if (req.user?.role !== "super_admin") {
    filter.organization_id = req.user?.organization_id;
  }
  return filter;
};

export const findScopedShipment = (req, id) => {
  return Shipment.findOne(shipmentScope(req, id));
};

export const requireOrganization = (req) => {
  if (req.user?.role === "super_admin") return null;
  return req.user?.organization_id || null;
};
