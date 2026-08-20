import mongoose from "mongoose";

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    fuel_date: { type: Date, required: true, default: Date.now },
    liters: { type: Number, required: true },
    cost_per_liter: { type: Number, required: true },
    total_cost: { type: Number, required: true },
    odometer_reading: { type: Number, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

fuelLogSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

fuelLogSchema.set("toObject", { virtuals: true });

const FuelLog = mongoose.models.FuelLog || mongoose.model("FuelLog", fuelLogSchema);
export default FuelLog;
