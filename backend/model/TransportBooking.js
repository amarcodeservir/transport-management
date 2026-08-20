import mongoose from "mongoose";

const transportBookingSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    transporter_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    pickup_location: { type: String, required: true, trim: true },
    drop_location: { type: String, required: true, trim: true },
    vehicle_type: { type: String, required: true, trim: true },
    goods_type: { type: String, required: true, trim: true },
    approximate_weight: { type: Number, required: true, min: 0 },
    pickup_date: { type: Date, required: true },
    pickup_time: { type: String, required: true },
    customer_name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"], default: "PENDING", index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

transportBookingSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret.__v; },
});

export default mongoose.models.TransportBooking || mongoose.model("TransportBooking", transportBookingSchema);
