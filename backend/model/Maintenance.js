import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    service_type: { type: String, required: true },
    service_date: { type: Date, required: true, default: Date.now, index: true },
    cost: { type: Number, required: true },
    description: { type: String, default: null },
    performed_by: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

maintenanceSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

maintenanceSchema.set("toObject", { virtuals: true });

const Maintenance = mongoose.models.Maintenance || mongoose.model("Maintenance", maintenanceSchema);
export default Maintenance;
