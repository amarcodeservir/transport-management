import Notification from "../model/Notification.js";
import User from "../model/User.js";

const scopeFilter = (req) => {
  const conditions = [{ user_id: null, organization_id: null }];
  if (req.user?.id) conditions.push({ user_id: req.user.id });
  if (req.user?.organization_id && req.user?.role === "organization_admin") {
    conditions.push({ organization_id: req.user.organization_id });
  }
  return { $or: conditions };
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find(scopeFilter(req)).sort({ created_at: -1 }).limit(100);
    const unread_count = notifications.filter((n) => !n.is_read).length;
    res.json({ success: true, data: notifications, unread_count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch notifications", error: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { user_id, organization_id, type = "INFO", title, message, link } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: "Title and message are required" });

    const targetOrganizationId = req.user?.role === "super_admin" ? (organization_id || null) : req.user?.organization_id;
    if (user_id) {
      const targetUser = await User.findOne({
        _id: user_id,
        ...(req.user?.role === "super_admin" ? {} : { organization_id: targetOrganizationId }),
      });
      if (!targetUser) return res.status(404).json({ success: false, message: "Notification user not found in this organization" });
    }

    const notification = await Notification.create({
      user_id: user_id || null,
      organization_id: targetOrganizationId || null,
      type,
      title,
      message,
      link: link || null,
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create notification", error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, ...scopeFilter(req) });
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark notification", error: error.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(scopeFilter(req), { is_read: true, read_at: new Date() });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark notifications", error: error.message });
  }
};
