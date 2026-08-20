import OrganizationSubscription from "../model/OrganizationSubscription.js";
import User from "../model/User.js";
import Vehicle from "../model/Vehicle.js";
import Shipment from "../model/Shipment.js";

export const checkSubscriptionLimit = async (organizationId, resource) => {
  if (!organizationId) return { allowed: true };

  const subscription = await OrganizationSubscription.findOne({ organization_id: organizationId });
  if (!subscription) return { allowed: true };

  const status = String(subscription.status || "").toUpperCase();
  const now = new Date();
  if (subscription.end_date && new Date(subscription.end_date) < now) {
    return { allowed: false, statusCode: 402, message: "Organization subscription is inactive or expired" };
  }
  if (!["ACTIVE", "TRIAL"].includes(status)) {
    return { allowed: false, statusCode: 402, message: "Organization subscription is inactive or expired" };
  }

  let limit = 0;
  let current = 0;

  if (resource === "admins") {
    limit = subscription.max_admins;
    current = await User.countDocuments({ organization_id: organizationId, role: "organization_admin" });
  } else if (resource === "users") {
    limit = subscription.max_users;
    current = await User.countDocuments({ organization_id: organizationId });
  } else if (resource === "vehicles") {
    limit = subscription.max_vehicles;
    current = await Vehicle.countDocuments({ organization_id: organizationId });
  } else if (resource === "monthly_shipments") {
    limit = subscription.max_shipments_per_month;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    current = await Shipment.countDocuments({ organization_id: organizationId, created_at: { $gte: startOfMonth } });
  } else {
    throw new Error(`Unknown subscription resource: ${resource}`);
  }

  return {
    allowed: current < limit,
    statusCode: 409,
    current,
    limit,
    message: current < limit ? null : `Subscription limit reached for ${resource.replace("_", " ")} (${current}/${limit})`,
  };
};
