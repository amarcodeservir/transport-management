import ActivityLog from "../model/ActivityLog.js";
import Organization from "../model/Organization.js";

export const getActivityLogs = async (req, res) => {
  try {
    const { organization_id, action, search, from, to } = req.query;
    const filter = {};

    if (organization_id) filter.organization_id = organization_id;
    if (action) filter.action = action;

    if (from || to) {
      filter.created_at = {};
      if (from) filter.created_at.$gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.created_at.$lte = endDate;
      }
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ action: regex }, { module: regex }];
    }

    const limit = Math.min(500, Math.max(10, Number(req.query.limit) || 200));

    const logs = await ActivityLog.find(filter)
      .populate("user_id", "name email")
      .populate("organization_id", "name code")
      .sort({ created_at: -1 })
      .limit(limit);

    const rows = logs.map((a) => {
      const doc = a.toJSON();
      return {
        ...doc,
        actor_name: a.user_id?.name || null,
        actor_email: a.user_id?.email || null,
        organization_name: a.organization_id?.name || null,
        organization_code: a.organization_id?.code || null,
      };
    });

    const organizations = await Organization.find().select("name code").sort({ name: 1 });
    const distinctActions = await ActivityLog.distinct("action");

    const total = await ActivityLog.countDocuments();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = await ActivityLog.countDocuments({ created_at: { $gte: startOfToday } });
    const distinctActors = (await ActivityLog.distinct("user_id")).length;
    const distinctOrgs = (await ActivityLog.distinct("organization_id")).length;

    res.json({
      success: true,
      data: {
        rows,
        organizations,
        actions: distinctActions.sort(),
        summary: { total, today, actors: distinctActors, organizations: distinctOrgs },
      },
    });
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch activity logs", error: error.message });
  }
};
