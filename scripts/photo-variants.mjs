// Makes 160w, 400w and 800w WebP copies of every public/products/*.jpg so cards can use srcset.
// Run after adding or replacing a product photo: npm run photos   (add --force to rebuild all)
// Each width has a byte budget: quality steps down for very detailed photos until it fits, so one
// busy texture cannot blow the mobile LCP budget (PRD NFR-01/02).
// sharp ships with Next.js; the generated files are committed, so builds never need it.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const dir = path.join(process.cwd(), "public", "products");
const force = process.argv.includes("--force");
const SPEC = [
  { w: 160, q: 70, budget: 8 * 1024 },
  { w: 400, q: 70, budget: 24 * 1024 },
  { w: 800, q: 74, budget: 80 * 1024 },
];
const MIN_Q = 50;
let made = 0;
for (const f of fs.readdirSync(dir).filter((x) => /^p_\w+\.jpg$/.test(x))) {
  const src = path.join(dir, f);
  for (const { w, q, budget } of SPEC) {
    const out = path.join(dir, f.replace(/\.jpg$/, `-${w}.webp`));
    if (!force && fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) continue;
    const resized = await sharp(src).resize(w, w, { fit: "cover" }).toBuffer();
    let quality = q, buf;
    do {
      buf = await sharp(resized).webp({ quality, effort: 6 }).toBuffer();
      quality -= 6;
    } while (buf.length > budget && quality >= MIN_Q);
    fs.writeFileSync(out, buf);
    made++;
  }
}
console.log(`photo variants: ${made} written`);
