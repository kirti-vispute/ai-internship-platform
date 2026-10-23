import fs from "fs";

const src = "C:/Users/kirti/.cursor/projects/d-InternAiNew/agent-tools/28baa7e6-3ff4-4121-97fc-f5ed44100ffd.txt";
const out = new URL("../app/uiverse-tasty-dragon.css", import.meta.url);

const text = fs.readFileSync(src, "utf8");
let css = text.slice(text.indexOf(".container {"), text.indexOf("Save to favorites")).trim();

const titleIdx = css.indexOf("#title");
const introIdx = css.indexOf("@keyframes introFadeUp");
if (titleIdx >= 0 && introIdx > titleIdx) {
  css = css.slice(0, titleIdx).trim();
} else if (introIdx >= 0) {
  css = css.slice(0, introIdx).trim();
}
css = css.replace(/\.container/g, ".uiverse-homepage-bg .container");
css = css.replace(/#stars3\b/g, ".uiverse-homepage-bg #stars3");
css = css.replace(/#stars2\b/g, ".uiverse-homepage-bg #stars2");
css = css.replace(/#stars\b/g, ".uiverse-homepage-bg #stars");

const file = `/* Uiverse: jaykdoe/tasty-dragon-12 — MIT License — used exactly as published */

${css}

@media (prefers-reduced-motion: reduce) {
  .uiverse-homepage-bg #stars,
  .uiverse-homepage-bg #stars2,
  .uiverse-homepage-bg #stars3 {
    animation: none !important;
  }
}
`;

fs.writeFileSync(out, file);
console.log("written", fs.statSync(out).size, "bytes");
