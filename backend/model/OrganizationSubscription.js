import mongoose from "mongoose";

const organizationSubscriptionSchema = new mongoose.Schema(
  {
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    plan: { type: String, enum: ["STARTER", "PRO", "ENTERPRISE"], default: "STARTER" },
    status: { type: String, enum: ["ACTIVE", "EXPIRED", "SUSPENDED"], default: "ACTIVE" },
    billing_cycle: { type: String, enum: ["MONTHLY", "YEARLY"], default: "MONTHLY" },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date, default: null },
    price: { type: Number, default: 0 },
    max_admins: { type: Number, default: 2 },
    max_users: { type: Number, default: 50 },
    max_vehicles: { type: Number, default: 25 },
    max_shipments_per_month: { type: Number, default: 500 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

organizationSubscriptionSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

organizationSubscriptionSchema.set("toObject", { virtuals: true });

const OrganizationSubscription = mongoose.models.OrganizationSubscription || mongoose.model("OrganizationSubscription", organizationSubscriptionSchema);
export default OrganizationSubscription;
