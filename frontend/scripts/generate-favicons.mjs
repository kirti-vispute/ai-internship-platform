import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public", "brand");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1f6fff"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#g)"/>
  <path d="M9 21V11h3v5l5-4 5 4v-5h3v10h-5v-5l-5 4-5-4v5z" fill="#fff"/>
</svg>`;

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.log("sharp not installed; skipping PNG favicon generation. SVG icons remain active.");
    return;
  }

  await mkdir(publicDir, { recursive: true });
  const sizes = [16, 32, 48, 180, 512];
  const buffers = await Promise.all(
    sizes.map((size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer())
  );

  for (let i = 0; i < sizes.length; i += 1) {
    const size = sizes[i];
    const filename = size === 180 ? "apple-touch-icon.png" : `favicon-${size}.png`;
    await writeFile(path.join(publicDir, filename), buffers[i]);
  }

  const icoBuffer = await sharp(buffers[1]).resize(32, 32).toFormat("png").toBuffer();
  await writeFile(path.join(publicDir, "..", "favicon.ico"), icoBuffer);
  console.log("Favicon PNG assets generated in public/brand and public/favicon.ico");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
