import fs from "fs";
import path from "path";

const root = path.resolve("app/dashboard/intern");

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "page.tsx") patchLoading(full);
  }
}

function patchLoading(file) {
  let s = fs.readFileSync(file, "utf8");
  if (!s.includes('useState(true)') || !s.includes("setLoading(true)")) return;

  if (!s.includes("peekInternProfile")) {
    s = s.replace(
      /from "@\/lib\/intern-portal";/,
      (match) => `${match}\nimport { peekInternProfile } from "@/lib/intern-portal";`
    );
    s = s.replace(
      /(import \{[^}]*) \} from "@\/lib\/intern-portal";/,
      (block) => {
        if (block.includes("peekInternProfile")) return block + " } from \"@/lib/intern-portal\";";
        return block.replace(" } from", ", peekInternProfile } from");
      }
    );
  }

  s = s.replace(
    /const \[loading, setLoading\] = useState\(true\);/g,
    "const [loading, setLoading] = useState(() => typeof window === \"undefined\" ? true : !peekInternProfile());"
  );

  s = s.replace(
    /(\s+)setLoading\(true\);\n/g,
    "$1if (!peekInternProfile()) setLoading(true);\n"
  );

  fs.writeFileSync(file, s);
  console.log("Patched", file);
}

walk(root);
