import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoice_number: { type: String, required: true, unique: true, trim: true },
    shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true, index: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    invoice_date: { type: Date, required: true, default: Date.now },
    due_date: { type: Date, default: null },
    subtotal: { type: Number, default: 0 },
    maintenance_charge: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },
    status: { type: String, enum: ["DRAFT", "ISSUED", "PAID", "CANCELLED"], default: "ISSUED", index: true },
    notes: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

invoiceSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

invoiceSchema.set("toObject", { virtuals: true });

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
export default Invoice;
