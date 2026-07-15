const path = require("path");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const InternProfile = require("../models/InternProfile");
const { logActivity } = require("../services/activity-log.service");
const {
  CERTIFICATION_STATUS,
  createCertificationSubmission,
  getCertificationFileRecord,
  getCertificationForUser,
  getCertificationStats,
  listCertificationsForAdmin,
  listUserCertifications,
  reviewCertification
} = require("../services/certification.service");

async function getInternProfileId(userId) {
  const profile = await InternProfile.findOne({ user: userId }).select("_id");
  if (!profile) throw new AppError("Intern profile not found", 404);
  return profile._id;
}

exports.listMyCertifications = asyncHandler(async (req, res) => {
  const [certifications, stats] = await Promise.all([
    listUserCertifications(req.user._id),
    getCertificationStats(req.user._id)
  ]);
  res.json({ certifications, stats });
});

exports.getMyCertification = asyncHandler(async (req, res) => {
  const certification = await getCertificationForUser(req.user._id, req.params.certificationId);
  res.json({ certification });
});

exports.submitCertification = asyncHandler(async (req, res) => {
  const internProfileId = await getInternProfileId(req.user._id);
  const certification = await createCertificationSubmission({
    userId: req.user._id,
    internProfileId,
    body: req.body,
    file: req.file
  });

  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "certification",
    entityId: certification._id,
    action: "certification_submitted",
    metadata: {
      courseName: certification.courseName,
      provider: certification.provider,
      status: CERTIFICATION_STATUS.PENDING
    },
    ipAddress: req.ip
  });

  res.status(201).json({
    message: "Certification submitted for verification",
    certification
  });
});

exports.downloadMyCertificate = asyncHandler(async (req, res) => {
  const { item, absolutePath } = await getCertificationFileRecord(req.params.certificationId, {
    userId: req.user._id
  });

  const download = req.query.download === "1";
  const fileName = item.certificateFile.originalName || path.basename(absolutePath);

  if (download) {
    return res.download(absolutePath, fileName);
  }

  res.sendFile(absolutePath);
});

exports.listCertificationsAdmin = asyncHandler(async (req, res) => {
  const certifications = await listCertificationsForAdmin({
    status: req.query.status,
    q: req.query.q,
    limit: req.query.limit
  });
  res.json({ certifications });
});

exports.reviewCertificationAdmin = asyncHandler(async (req, res) => {
  const { status, rejectionReason = "" } = req.body || {};
  const certification = await reviewCertification({
    certificationId: req.params.certificationId,
    adminUserId: req.user._id,
    status,
    rejectionReason
  });

  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "certification",
    entityId: certification._id,
    action: status === CERTIFICATION_STATUS.VERIFIED ? "certification_approved" : "certification_rejected",
    metadata: {
      courseName: certification.courseName,
      status,
      rejectionReason: certification.rejectionReason || ""
    },
    ipAddress: req.ip
  });

  res.json({
    message: status === CERTIFICATION_STATUS.VERIFIED ? "Certification approved" : "Certification rejected",
    certification
  });
});

exports.downloadCertificateAdmin = asyncHandler(async (req, res) => {
  const { item, absolutePath } = await getCertificationFileRecord(req.params.certificationId, {
    isAdmin: true
  });

  const download = req.query.download === "1";
  const fileName = item.certificateFile.originalName || path.basename(absolutePath);

  if (download) {
    return res.download(absolutePath, fileName);
  }

  res.sendFile(absolutePath);
});
