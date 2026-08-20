import mongoose from "mongoose";

const shipmentPackageSchema = new mongoose.Schema(
  {
    shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true, index: true },
    package_type: { type: String, default: null },
    quantity: { type: Number, default: 1 },
    weight: { type: Number, default: 0 },
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

shipmentPackageSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

shipmentPackageSchema.set("toObject", { virtuals: true });

const ShipmentPackage = mongoose.models.ShipmentPackage || mongoose.model("ShipmentPackage", shipmentPackageSchema);
export default ShipmentPackage;
