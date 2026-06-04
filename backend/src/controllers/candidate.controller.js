const InternProfile = require("../models/InternProfile");
const asyncHandler = require("../utils/asyncHandler");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.searchCandidates = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 100);
  if (!q) {
    return res.json({ candidates: [] });
  }

  const regex = new RegExp(escapeRegex(q), "i");
  const candidates = await InternProfile.find({
    $or: [{ fullName: regex }, { email: regex }]
  })
    .select("_id fullName email mobile skills resume.score")
    .sort({ updatedAt: -1 })
    .limit(25);

  return res.json({
    candidates: candidates.map((candidate) => ({
      _id: candidate._id,
      fullName: candidate.fullName || "",
      email: candidate.email || "",
      mobile: candidate.mobile || "",
      skills: candidate.skills || [],
      resumeScore: candidate.resume?.score || 0
    }))
  });
});
