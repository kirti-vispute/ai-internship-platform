const mongoose = require("mongoose");
const { REPORTED_COMPANY_STATUS } = require("../constants/enums");

const reportedCompanySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfile",
      required: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(REPORTED_COMPANY_STATUS),
      default: REPORTED_COMPANY_STATUS.OPEN
    },
    resolutionNote: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReportedCompany", reportedCompanySchema);
