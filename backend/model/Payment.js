import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    amount: { type: Number, required: true },
    payment_date: { type: Date, required: true, default: Date.now },
    payment_method: { type: String, required: true },
    reference_number: { type: String, default: null },
    notes: { type: String, default: null },
    status: { type: String, enum: ["COMPLETED", "PENDING", "FAILED"], default: "COMPLETED" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

paymentSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

paymentSchema.set("toObject", { virtuals: true });

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export default Payment;