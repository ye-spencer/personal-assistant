// Bundles public/favicon.svg into app/favicon.ico at the sizes browsers care
// about (16, 32, 48). Run once after changing the icon design:
//   pnpm build:favicon
//
// Deps: sharp (raster), png-to-ico (container).

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const svgPath = join(root, "public", "favicon.svg");
const outPath = join(root, "app", "favicon.ico");

const svg = await readFile(svgPath);

const pngs = await Promise.all(
  [16, 32, 48].map((size) =>
    sharp(svg).resize(size, size).png().toBuffer(),
  ),
);

const ico = await pngToIco(pngs);
await writeFile(outPath, ico);

console.log(`Wrote ${outPath} (${ico.length} bytes)`);
