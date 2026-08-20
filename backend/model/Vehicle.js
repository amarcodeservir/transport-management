import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicle_number: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vehicle_type: { type: String, required: true, trim: true },
    brand: { type: String, default: null },
    model: { type: String, default: null },
    capacity: { type: String, default: null },
    fuel_type: { type: String, default: null },
    insurance_expiry: { type: Date, default: null },
    fitness_expiry: { type: Date, default: null },
    permit_expiry: { type: Date, default: null },
    status: { type: String, default: "AVAILABLE" },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

vehicleSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

vehicleSchema.set("toObject", { virtuals: true });

const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
