import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
    ip_address: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

activityLogSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

activityLogSchema.set("toObject", { virtuals: true });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
