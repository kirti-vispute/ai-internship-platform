const MAX_LINE_CHARS = 95;

function wrapLine(line) {
  const text = String(line || "");
  if (text.length <= MAX_LINE_CHARS) return [text];

  const words = text.split(" ");
  const wrapped = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > MAX_LINE_CHARS) {
      if (current) wrapped.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) wrapped.push(current);
  return wrapped;
}

function buildSimplePdf(lines) {
  let y = 750;
  const ops = lines
    .flatMap((line) => wrapLine(line))
    .map((line) => {
      const escaped = String(line || "")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
      const op = `BT /F1 11 Tf 56 ${y} Td (${escaped}) Tj ET`;
      y -= 16;
      return op;
    })
    .join("\n");

  const streamBytes = Buffer.from(ops, "latin1");

  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objects[3] =
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[5] = `<< /Length ${streamBytes.length} >>\nstream\n${ops}\nendstream`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 1; i <= 5; i += 1) {
    offsets[i] = Buffer.byteLength(pdf, "latin1");
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

module.exports = { buildSimplePdf };
