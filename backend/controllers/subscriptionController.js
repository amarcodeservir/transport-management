import Organization from "../model/Organization.js";
import OrganizationSubscription from "../model/OrganizationSubscription.js";
import { recordActivity } from "../utils/activityLogger.js";

const PLANS = new Set(["TRIAL", "STARTER", "GROWTH", "ENTERPRISE", "CUSTOM"]);
const STATUSES = new Set(["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED", "EXPIRED"]);
const CYCLES = new Set(["MONTHLY", "YEARLY", "CUSTOM"]);

const defaults = {
  plan: "TRIAL",
  status: "TRIAL",
  billing_cycle: "MONTHLY",
  start_date: null,
  end_date: null,
  price: 0,
  max_admins: 2,
  max_users: 50,
  max_vehicles: 25,
  max_shipments_per_month: 500,
  notes: null,
};

export const getSubscriptions = async (req, res) => {
  try {
    const { search = "", status = "", organization_id = "" } = req.query;
    const organizationFilter = {};

    if (organization_id) organizationFilter._id = organization_id;
    if (search) {
      const regex = new RegExp(search, "i");
      organizationFilter.$or = [{ name: regex }, { code: regex }, { email: regex }];
    }

    const organizations = await Organization.find(organizationFilter).sort({ name: 1 });
    const subscriptions = organizations.length
      ? await OrganizationSubscription.find({ organization_id: { $in: organizations.map((o) => o._id) } })
      : [];

    const subscriptionsByOrganization = new Map(
      subscriptions.map((s) => [String(s.organization_id), s.toJSON()])
    );

    let rows = organizations.map((organization) => ({
      organization_id: organization.id,
      organization_name: organization.name,
      organization_code: organization.code,
      organization_status: organization.status,
      organization_email: organization.email,
      ...defaults,
      ...(subscriptionsByOrganization.get(String(organization._id)) || {}),
    }));

    if (status) rows = rows.filter((row) => row.status === String(status).toUpperCase());

    const summary = rows.reduce(
      (result, row) => {
        result.total += 1;
        if (["ACTIVE", "TRIAL"].includes(row.status)) result.active += 1;
        if (row.status === "TRIAL") result.trial += 1;
        if (["PAST_DUE", "SUSPENDED", "EXPIRED"].includes(row.status)) result.attention += 1;
        result.monthly_value += Number(row.price || 0);
        return result;
      },
      { total: 0, active: 0, trial: 0, attention: 0, monthly_value: 0 }
    );

    res.json({ success: true, data: { rows, summary } });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch subscriptions", error: error.message });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const organization = await Organization.findById(organizationId);
    if (!organization) return res.status(404).json({ success: false, message: "Organization not found" });

    const plan = String(req.body.plan || "").toUpperCase();
    const status = String(req.body.status || "").toUpperCase();
    const billingCycle = String(req.body.billing_cycle || "").toUpperCase();

    if (!PLANS.has(plan)) return res.status(400).json({ success: false, message: "Invalid subscription plan" });
    if (!STATUSES.has(status)) return res.status(400).json({ success: false, message: "Invalid subscription status" });
    if (!CYCLES.has(billingCycle)) return res.status(400).json({ success: false, message: "Invalid billing cycle" });

    const numericFields = ["price", "max_admins", "max_users", "max_vehicles", "max_shipments_per_month"];
    for (const field of numericFields) {
      if (!Number.isFinite(Number(req.body[field])) || Number(req.body[field]) < 0) {
        return res.status(400).json({ success: false, message: `${field} must be a non-negative number` });
      }
    }
    if (req.body.start_date && req.body.end_date && req.body.end_date < req.body.start_date) {
      return res.status(400).json({ success: false, message: "Subscription end date cannot be before start date" });
    }

    const payload = {
      plan,
      status,
      billing_cycle: billingCycle,
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null,
      price: Number(req.body.price),
      max_admins: Number(req.body.max_admins),
      max_users: Number(req.body.max_users),
      max_vehicles: Number(req.body.max_vehicles),
      max_shipments_per_month: Number(req.body.max_shipments_per_month),
      notes: req.body.notes ? String(req.body.notes).trim() : null,
    };

    let subscription = await OrganizationSubscription.findOne({ organization_id: organization._id });
    if (!subscription) {
      subscription = await OrganizationSubscription.create({ organization_id: organization._id, ...payload });
    } else {
      Object.assign(subscription, payload);
      await subscription.save();
    }

    await recordActivity({
      req,
      organizationId: organization._id,
      action: "SUBSCRIPTION_UPDATED",
      entityType: "organization_subscription",
      entityId: subscription.id,
      description: `${organization.name} subscription updated to ${plan} (${status})`,
      metadata: { plan, status, billing_cycle: billingCycle, end_date: payload.end_date },
    });

    res.json({ success: true, message: "Subscription updated successfully", data: subscription });
  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({ success: false, message: "Failed to update subscription", error: error.message });
  }
};
