import fs from "fs";
import path from "path";

const root = path.resolve("app/dashboard/intern");

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "page.tsx") fixReturn(full);
  }
}

function fixReturn(file) {
  let s = fs.readFileSync(file, "utf8");
  if (!/return \(\s*\n\s*(\{|<)/.test(s)) return;

  if (/return \(\s*\n\s*\{/.test(s)) {
    s = s.replace(/return \(\s*\n\s*\{/m, "return (\n    <>\n      {");
    s = s.replace(/\n\s*\);\s*\n\}\s*$/m, "\n    </>\n  );\n}\n");
  } else if (/return \(\s*\n\s*<[^>]+>[\s\S]*\n\s*\{/.test(s)) {
    s = s.replace(/return \(\s*\n/m, "return (\n    <>\n");
    s = s.replace(/\n\s*\);\s*\n\}\s*$/m, "\n    </>\n  );\n}\n");
  }

  fs.writeFileSync(file, s);
  console.log("Fixed", file);
}

walk(root);
