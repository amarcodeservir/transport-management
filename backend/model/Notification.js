import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
    type: { type: String, default: "INFO" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: null },
    is_read: { type: Boolean, default: false, index: true },
    read_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

notificationSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

notificationSchema.set("toObject", { virtuals: true });

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;