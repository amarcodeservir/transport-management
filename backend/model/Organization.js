import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    gst_number: { type: String, default: null },
    pan_number: { type: String, default: null },
    cin_number: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    website: { type: String, default: null },
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    pincode: { type: String, default: null },
    status: { type: String, default: "Active" },
    logo: { type: String, default: null },
    browser_title: { type: String, default: null },
    favicon: { type: String, default: null },
    primary_color: { type: String, default: "#F7941D" },
    secondary_color: { type: String, default: "#1B2A5B" },
    accent_color: { type: String, default: "#2563EB" },
    sidebar_color: { type: String, default: "#FFFFFF" },
    timezone: { type: String, default: "Asia/Kolkata" },
    currency: { type: String, default: "INR" },
    date_format: { type: String, default: "DD/MM/YYYY" },
    invoice_prefix: { type: String, default: "INV" },
    support_email: { type: String, default: null },
    billing_email: { type: String, default: null },
    bank_name: { type: String, default: null },
    bank_account_number: { type: String, default: null },
    bank_ifsc: { type: String, default: null },
    bank_branch: { type: String, default: null },
    payment_terms: { type: String, default: "Due on Receipt" },
    location: {
      type: { type: String, enum: ["Point"], default: undefined },
      coordinates: {
        type: [Number],
        validate: {
          validator: (value) => !value?.length || (value.length === 2 && value.every(Number.isFinite)),
          message: "Location coordinates must be [longitude, latitude]",
        },
        default: undefined,
      },
    },
    transport_profile_approved: { type: Boolean, default: false, index: true },
    owner_name: { type: String, default: null, trim: true },
    service_areas: { type: [String], default: [] },
    service_types: { type: [String], default: [] },
    opening_hours: { type: String, default: null },
    whatsapp: { type: String, default: null },
    rating: { type: Number, min: 0, max: 5, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

organizationSchema.index({ location: "2dsphere" });
organizationSchema.pre("validate", function setGeoJsonType(next) {
  if (this.location?.coordinates?.length === 2) this.location.type = "Point";
  next();
});

organizationSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

organizationSchema.set("toObject", { virtuals: true });

const Organization = mongoose.models.Organization || mongoose.model("Organization", organizationSchema);
export default Organization;
