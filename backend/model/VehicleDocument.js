import mongoose from "mongoose";

const vehicleDocumentSchema = new mongoose.Schema(
  {
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    document_type: { type: String, required: true },
    document_number: { type: String, default: null },
    issue_date: { type: Date, default: null },
    expiry_date: { type: Date, default: null },
    document_url: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

vehicleDocumentSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

vehicleDocumentSchema.set("toObject", { virtuals: true });

const VehicleDocument = mongoose.models.VehicleDocument || mongoose.model("VehicleDocument", vehicleDocumentSchema);
export default VehicleDocument;
