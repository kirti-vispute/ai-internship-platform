import fs from "fs";
import path from "path";

const root = path.resolve("app/dashboard/intern");

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "page.tsx") transform(full);
  }
}

function transform(file) {
  let s = fs.readFileSync(file, "utf8");
  if (!s.includes("InternShell")) return;

  s = s.replace(/\n\s*function handleLogout\(\) \{[\s\S]*?\n\s*\}\n/g, "\n");
  s = s.replace(/\n\s*const handleLogout = \(\) => \{[\s\S]*?\n\s*\};\n/g, "\n");
  s = s.replace(/<RoleDashboardGuard expectedRole="intern">\s*<InternShell[^>]*>\s*/g, "");
  s = s.replace(/\s*<\/InternShell>\s*<\/RoleDashboardGuard>/g, "");
  s = s.replace(/import \{ RoleDashboardGuard \} from "@\/components\/ui\/role-dashboard-guard";\n/g, "");
  s = s.replace(/import \{ InternShell \} from "@\/components\/dashboard\/intern-shell";\n/g, "");
  s = s.replace(/import \{ clearAuthSession \} from "@\/lib\/session";\n/g, "");
  s = s.replace(/import \{ clearAuthSession, /g, "import { ");
  s = s.replace(/, clearAuthSession/g, "");

  if (!/router\./.test(s)) {
    s = s.replace(/import \{ useRouter \} from "next\/navigation";\n/g, "");
    s = s.replace(/import \{ useEffect, useRouter \} from "next\/navigation";\n/g, 'import { useEffect } from "next/navigation";\n');
    s = s.replace(/import \{ useMemo, useRouter \} from "next\/navigation";\n/g, 'import { useMemo } from "next/navigation";\n');
    s = s.replace(/import \{ useEffect, useMemo, useRouter \} from "next\/navigation";\n/g, 'import { useEffect, useMemo } from "next/navigation";\n');
    s = s.replace(/import \{ useEffect, useState, useRouter \} from "next\/navigation";\n/g, 'import { useEffect, useState } from "next/navigation";\n');
    s = s.replace(/\n\s*const router = useRouter\(\);\n/g, "\n");
  }

  fs.writeFileSync(file, s);
  console.log("Updated", file);
}

walk(root);
