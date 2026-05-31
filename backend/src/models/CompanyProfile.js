const mongoose = require("mongoose");
const { COMPANY_VERIFICATION_STATUS } = require("../constants/enums");

const companyProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    companyName: { type: String, required: true, trim: true },
    companyEmail: { type: String, required: true, lowercase: true, trim: true },
    gst: { type: String, required: true, trim: true, uppercase: true },
    contactName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    verificationStatus: {
      type: String,
      enum: Object.values(COMPANY_VERIFICATION_STATUS),
      default: COMPANY_VERIFICATION_STATUS.PENDING
    },
    verificationDocuments: [{ type: String, trim: true }],
    linkedInUrl: { type: String, default: "", trim: true },
    hrIdentityProofUrl: { type: String, default: "", trim: true },
    businessRegistrationProofUrl: { type: String, default: "", trim: true },
    verifiedBadgeIssuedAt: { type: Date, default: null },
    verifiedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectionReason: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);
