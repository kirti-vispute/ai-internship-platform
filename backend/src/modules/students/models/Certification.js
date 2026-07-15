const mongoose = require("mongoose");

const CERTIFICATION_STATUS = Object.freeze({
  PENDING: "pending_verification",
  VERIFIED: "verified",
  REJECTED: "rejected"
});

const certificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    internProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternProfile",
      index: true
    },
    courseName: { type: String, required: true, trim: true, maxlength: 200 },
    skillCategory: { type: String, required: true, trim: true, maxlength: 80 },
    provider: { type: String, required: true, trim: true, maxlength: 120 },
    completionDate: { type: Date, required: true },
    credentialUrl: { type: String, default: "", trim: true, maxlength: 500 },
    credentialId: { type: String, default: "", trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    certificateFile: {
      originalName: { type: String, default: "" },
      storedName: { type: String, default: "" },
      filePath: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      fileSize: { type: Number, default: 0 },
      fileHash: { type: String, default: "", index: true }
    },
    verificationStatus: {
      type: String,
      enum: Object.values(CERTIFICATION_STATUS),
      default: CERTIFICATION_STATUS.PENDING,
      index: true
    },
    uploadTimestamp: { type: Date, default: Date.now },
    adminReviewTimestamp: { type: Date, default: null },
    adminReviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectionReason: { type: String, default: "", trim: true, maxlength: 500 },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

certificationSchema.index(
  { user: 1, credentialUrl: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      credentialUrl: { $type: "string", $ne: "" }
    }
  }
);

certificationSchema.index(
  { user: 1, credentialId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      credentialId: { $type: "string", $ne: "" }
    }
  }
);

certificationSchema.index(
  { user: 1, "certificateFile.fileHash": 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      "certificateFile.fileHash": { $type: "string", $ne: "" }
    }
  }
);

const Certification = mongoose.model("Certification", certificationSchema);

module.exports = { Certification, CERTIFICATION_STATUS };
