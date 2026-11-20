export function GET(req: Request) {
  const u = new URL(req.url);
  const h = Math.abs(Number(u.searchParams.get("h") ?? 20)) % 360;
  const e = (u.searchParams.get("e") ?? "📦").slice(0, 4).replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="product illustration">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 80% 90%)"/><stop offset="1" stop-color="hsl(${(h + 35) % 360} 70% 72%)"/></linearGradient>
<pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="2.5" fill="hsl(${h} 60% 40% / .12)"/></pattern></defs>
<rect width="400" height="400" fill="url(#g)"/><rect width="400" height="400" fill="url(#p)"/>
<circle cx="200" cy="210" r="132" fill="hsl(${h} 80% 97% / .55)"/>
<text x="200" y="262" font-size="150" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${e}</text></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=31536000, immutable" } });
}
