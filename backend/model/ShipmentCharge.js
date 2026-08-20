import mongoose from "mongoose";

const shipmentChargeSchema = new mongoose.Schema(
  {
    shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true, index: true },
    freight_charge: { type: Number, default: 0 },
    loading_charge: { type: Number, default: 0 },
    unloading_charge: { type: Number, default: 0 },
    fuel_surcharge: { type: Number, default: 0 },
    insurance_charge: { type: Number, default: 0 },
    other_charge: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

shipmentChargeSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

shipmentChargeSchema.set("toObject", { virtuals: true });

const ShipmentCharge = mongoose.models.ShipmentCharge || mongoose.model("ShipmentCharge", shipmentChargeSchema);
export default ShipmentCharge;
