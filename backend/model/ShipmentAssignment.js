import mongoose from "mongoose";

const shipmentAssignmentSchema = new mongoose.Schema(
  {
    shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true, index: true },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    status: { type: String, enum: ["ASSIGNED", "ACCEPTED", "REJECTED", "RELEASED"], default: "ASSIGNED", index: true },
    assigned_at: { type: Date, default: Date.now },
    accepted_at: { type: Date, default: null },
    rejected_at: { type: Date, default: null },
    released_at: { type: Date, default: null },
    remarks: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

shipmentAssignmentSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

shipmentAssignmentSchema.set("toObject", { virtuals: true });

const ShipmentAssignment = mongoose.models.ShipmentAssignment || mongoose.model("ShipmentAssignment", shipmentAssignmentSchema);
export default ShipmentAssignment;