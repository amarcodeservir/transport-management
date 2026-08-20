import mongoose from "mongoose";

const shipmentSchema = new mongoose.Schema(
  {
    shipment_number: { type: String, required: true, unique: true, trim: true },
    tracking_number: { type: String, required: true, trim: true },
    lr_number: { type: String, default: null },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    ref_number: { type: String, default: null },
    indent_number: { type: String, default: null },
    booking_date: { type: Date, required: true, default: Date.now },
    shipment_date: { type: Date, default: null },
    weight: { type: Number, default: 0 },
    pickup_date: { type: Date, default: null },
    shipment_type: { type: String, default: "Domestic" },
    service_type: { type: String, default: "Standard" },
    mode: { type: String, default: "ROAD" },
    payment_mode: { type: String, default: "PREPAID" },
    origin: { type: String, default: null },
    destination: { type: String, default: null },
    expected_delivery_date: { type: Date, default: null },
    current_status: { type: String, default: "PENDING", index: true },
    remarks: { type: String, default: null },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null, index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null, index: true },
    pod_url: { type: String, default: null },
    pod_uploaded_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

shipmentSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

shipmentSchema.set("toObject", { virtuals: true });

const Shipment = mongoose.models.Shipment || mongoose.model("Shipment", shipmentSchema);
export default Shipment;
