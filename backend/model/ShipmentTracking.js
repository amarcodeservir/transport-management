import mongoose from "mongoose";

const shipmentTrackingSchema = new mongoose.Schema(
  {
    shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true, index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null, index: true },
    status: { type: String, required: true },
    location: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    speed: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    heading: { type: Number, default: null },
    remarks: { type: String, default: null },
    tracking_date: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

shipmentTrackingSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

shipmentTrackingSchema.set("toObject", { virtuals: true });

const ShipmentTracking = mongoose.models.ShipmentTracking || mongoose.model("ShipmentTracking", shipmentTrackingSchema);
export default ShipmentTracking;
