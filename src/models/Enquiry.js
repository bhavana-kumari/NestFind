import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    status: { type: String, enum: ["pending", "responded", "closed"], default: "pending" },
  },
  { timestamps: true }
);

enquirySchema.index({ tenant: 1, createdAt: -1 });
enquirySchema.index({ owner: 1, createdAt: -1 });
enquirySchema.index({ tenant: 1, property: 1, createdAt: -1 });

export default mongoose.model("Enquiry", enquirySchema);
