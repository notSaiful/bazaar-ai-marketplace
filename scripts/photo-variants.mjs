// Makes 160w, 400w and 800w WebP copies of every public/products/*.jpg so cards can use srcset.
// Run after adding or replacing a product photo: npm run photos
// sharp ships with Next.js; the generated files are committed, so builds never need it.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const dir = path.join(process.cwd(), "public", "products");
const WIDTHS = [160, 400, 800];
let made = 0;
for (const f of fs.readdirSync(dir).filter((x) => /^p_\w+\.jpg$/.test(x))) {
  const src = path.join(dir, f);
  for (const w of WIDTHS) {
    const out = path.join(dir, f.replace(/\.jpg$/, `-${w}.webp`));
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) continue;
    await sharp(src).resize(w, w, { fit: "cover" }).webp({ quality: w === 800 ? 74 : 70, effort: 6 }).toFile(out);
    made++;
  }
}
console.log(`photo variants: ${made} written`);
