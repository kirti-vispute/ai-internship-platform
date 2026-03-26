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
    rejectionReason: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);
