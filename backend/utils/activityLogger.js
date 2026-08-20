import ActivityLog from "../model/ActivityLog.js";

export const recordActivity = async ({
  req,
  organizationId = null,
  action,
  entityType,
  entityId = null,
  description,
  metadata = null,
}) => {
  try {
    await ActivityLog.create({
      actor_user_id: req?.user?.id || null,
      organization_id: organizationId || null,
      action,
      entity_type: entityType,
      entity_id: entityId == null ? null : String(entityId),
      description,
      metadata,
      ip_address: req?.ip || req?.socket?.remoteAddress || null,
    });
  } catch (error) {
    console.warn("Activity log could not be recorded:", error.message);
  }
};
