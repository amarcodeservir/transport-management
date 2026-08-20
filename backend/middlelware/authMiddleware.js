import jwt from "jsonwebtoken";
import User from "../model/User.js";
import Organization from "../model/Organization.js";
import OrganizationSubscription from "../model/OrganizationSubscription.js";

const normalizeRole = (role = "") => String(role).trim().toLowerCase().replace(/[-\s]+/g, "_");
const isActive = (status) => ["active", "enabled"].includes(String(status || "").trim().toLowerCase());

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Authentication is not configured on the server." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (!isActive(user.status)) {
      return res.status(403).json({ message: "Your account is inactive. Contact your administrator." });
    }

    const role = normalizeRole(user.role);
    if (["organization_admin", "driver"].includes(role) && !user.organization_id) {
      return res.status(403).json({ message: "Your account is not linked to an organization." });
    }
    if (user.organization_id && role !== "super_admin") {
      const organization = await Organization.findById(user.organization_id);
      if (!organization || !isActive(organization.status)) {
        return res.status(403).json({ message: "Your organization is inactive or unavailable." });
      }
      const subscription = await OrganizationSubscription.findOne({ organization_id: user.organization_id });
      if (subscription) {
        const subscriptionStatus = String(subscription.status || "").toUpperCase();
        const expiredByDate = subscription.end_date && new Date(subscription.end_date) < new Date();
        if (!["ACTIVE", "TRIAL"].includes(subscriptionStatus) || expiredByDate) {
          return res.status(402).json({ message: "Your organization subscription is inactive or expired. Contact your administrator." });
        }
      }
    }

    req.user = {
      id: user.id,
      role,
      organization_id: user.organization_id || null,
      status: user.status,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
  if (!normalizedAllowedRoles.includes(normalizeRole(req.user.role))) {
    return res.status(403).json({ message: "Forbidden. You do not have access to this resource." });
  }

  return next();
};
