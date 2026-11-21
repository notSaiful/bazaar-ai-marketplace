import { getMedia } from "@/lib/media-store";

export const dynamic = "force-dynamic";

/** Serves uploaded ad media from this instance's memory, with HTTP Range support (Safari needs it for video). */
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const m = getMedia(key);
  if (!m) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const size = m.bytes.length;
  const base = {
    "Content-Type": m.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
  };
  const range = req.headers.get("range");
  const r = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (r) {
    let start = r[1] === "" ? Math.max(0, size - Number(r[2])) : Number(r[1]);
    let end = r[1] !== "" && r[2] !== "" ? Number(r[2]) : size - 1;
    if (r[1] === "" && r[2] === "") return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${size}` } });
    end = Math.min(end, size - 1);
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${size}` } });
    start = Math.max(0, start);
    const chunk = m.bytes.slice(start, end + 1);
    return new Response(chunk, { status: 206, headers: { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(chunk.length) } });
  }
  return new Response(m.bytes.slice(), { status: 200, headers: { ...base, "Content-Length": String(size) } });
}
