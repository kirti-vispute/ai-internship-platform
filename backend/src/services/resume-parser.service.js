const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

async function extractPdfText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return String(result?.text || "").trim();
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractDocxText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return String(result?.value || "").trim();
}

async function parseResumeFile(file) {
  if (!file?.path) return "";

  const ext = path.extname(file.originalname || "").toLowerCase();
  const mime = String(file.mimetype || "").toLowerCase();

  if (mime === "text/plain" || ext === ".txt") {
    return fs.readFileSync(file.path, "utf8").trim();
  }

  if (mime === "application/pdf" || ext === ".pdf") {
    return extractPdfText(file.path);
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    return extractDocxText(file.path);
  }

  // Legacy .doc extraction is not reliable without external tools.
  return "";
}

module.exports = { parseResumeFile };
