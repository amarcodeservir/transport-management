import mongoose from "mongoose";

const shipmentPartySchema = new mongoose.Schema(
  {
    shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true, index: true },
    party_type: { type: String, enum: ["sender", "receiver"], required: true },
    name: { type: String, default: null },
    company_name: { type: String, default: null },
    gstin: { type: String, default: null },
    mobile: { type: String, default: null },
    phone: { type: String, default: null },
    email: { type: String, default: null },
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    pincode: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

shipmentPartySchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

shipmentPartySchema.set("toObject", { virtuals: true });

const ShipmentParty = mongoose.models.ShipmentParty || mongoose.model("ShipmentParty", shipmentPartySchema);
export default ShipmentParty;
