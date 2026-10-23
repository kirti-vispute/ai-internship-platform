import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.join(__dirname, "../.next/server/app/dashboard/company/page.js");
const outPath = path.join(__dirname, "../lib/company-portal.recovered.ts");
const source = fs.readFileSync(bundlePath, "utf8");

function decodeEvalAt(evalIdx) {
  const open = evalIdx + 6;
  let i = open + 1;
  let escaped = false;
  while (i < source.length) {
    const ch = source[i];
    if (!escaped && ch === '"') {
      if (source[i + 1] === ")") break;
    }
    escaped = !escaped && ch === "\\";
    i += 1;
  }
  const raw = source.slice(open + 1, i);
  return JSON.parse(`"${raw}"`);
}

let searchFrom = 0;
while (searchFrom < source.length) {
  const idx = source.indexOf("(ssr)/./lib/company-portal.ts", searchFrom);
  if (idx < 0) break;
  const evalIdx = source.indexOf('eval("__webpack_require__.r(__webpack_exports__);', idx);
  if (evalIdx >= 0) {
    const decoded = decodeEvalAt(evalIdx);
    if (decoded.includes("/api/company/profile")) {
      fs.writeFileSync(outPath, decoded);
      console.log("wrote", outPath, decoded.length);
      process.exit(0);
    }
  }
  searchFrom = idx + 1;
}

console.error("company portal module not found in bundle");
process.exit(1);
