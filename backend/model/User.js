import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    customer_code: { type: String, trim: true, default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true, default: null },
    role: {
      type: String,
      enum: ["super_admin", "organization_admin", "admin", "customer", "driver"],
      default: "customer",
    },
    company_name: { type: String, trim: true, default: null },
    gst_number: { type: String, trim: true, default: null },
    customer_type: { type: String, default: "Retail" },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    pincode: { type: String, default: null },
    status: { type: String, default: "Active" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

userSchema.set("toObject", { virtuals: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
