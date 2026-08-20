import mongoose from "mongoose";

const shipmentItemSchema = new mongoose.Schema(
  {
    shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true, index: true },
    item_name: { type: String, default: null },
    quantity: { type: Number, default: 1 },
    declared_value: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

shipmentItemSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

shipmentItemSchema.set("toObject", { virtuals: true });

const ShipmentItem = mongoose.models.ShipmentItem || mongoose.model("ShipmentItem", shipmentItemSchema);
export default ShipmentItem;
