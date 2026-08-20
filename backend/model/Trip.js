import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    trip_number: { type: String, required: true, unique: true, trim: true },
    shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", default: null, index: true },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    origin: { type: String, default: "" },
    destination: { type: String, default: "" },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date, default: null },
    status: { type: String, default: "Booked" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

tripSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

tripSchema.set("toObject", { virtuals: true });

const Trip = mongoose.models.Trip || mongoose.model("Trip", tripSchema);
export default Trip;
