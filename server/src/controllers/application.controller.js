const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");

exports.getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate("intern")
    .populate({ path: "internship", populate: { path: "company" } });

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  res.json({ application });
});
