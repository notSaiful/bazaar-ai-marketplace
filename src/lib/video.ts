/**
 * Server-side checks for seller ad uploads. The declared MIME type and file name are untrusted, so we
 * read the container ourselves: ISO-BMFF ("ftyp" box) for MP4/MOV, the movie header ("mvhd") for the
 * real duration, and a "vide" handler so an audio-only file cannot pass as a video.
 */
export const VIDEO_MIME = ["video/mp4", "video/quicktime"] as const;
export type VideoMime = (typeof VIDEO_MIME)[number];
/** Demo limit: Vercel functions accept ~4.5 MB request bodies. Real uploads go straight to storage (see README). */
export const MAX_VIDEO_BYTES = 4 * 1024 * 1024;
export const MIN_VIDEO_SECONDS = 3;
export const MAX_VIDEO_SECONDS = 60;
export const MAX_POSTER_BYTES = 300 * 1024;
export const MAX_CAPTION = 150;

export type VideoCheck =
  | { ok: true; mime: VideoMime; durationSec: number }
  | { ok: false; code: "type" | "unreadable" | "no_video" | "too_short" | "too_long" | "too_big" | "empty" };

const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
const fourcc = (b: Uint8Array, o: number) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

/** Iterate ISO-BMFF boxes in [start, end). Returns [type, payloadStart, boxEnd] tuples; stops on malformed sizes. */
function* boxes(b: Uint8Array, start: number, end: number): Generator<[string, number, number]> {
  let o = start;
  while (o + 8 <= end) {
    let size = u32(b, o);
    const type = fourcc(b, o + 4);
    let header = 8;
    if (size === 1) {
      if (o + 16 > end) return;
      const hi = u32(b, o + 8), lo = u32(b, o + 12);
      size = hi * 2 ** 32 + lo;
      header = 16;
    } else if (size === 0) size = end - o;
    if (size < header || o + size > end) return;
    yield [type, o + header, o + size];
    o += size;
  }
}
const child = (b: Uint8Array, start: number, end: number, type: string) => { for (const x of boxes(b, start, end)) if (x[0] === type) return x; return undefined; };

export function checkVideo(buf: Uint8Array, declared: string): VideoCheck {
  if (!buf.length) return { ok: false, code: "empty" };
  if (buf.length > MAX_VIDEO_BYTES) return { ok: false, code: "too_big" };
  if (!(VIDEO_MIME as readonly string[]).includes(declared)) return { ok: false, code: "type" };
  if (buf.length < 16 || fourcc(buf, 4) !== "ftyp") return { ok: false, code: "type" };
  const brand = fourcc(buf, 8);
  const mime: VideoMime = brand === "qt  " ? "video/quicktime" : "video/mp4";
  if (/^M4A |^M4B |^M4P /.test(brand)) return { ok: false, code: "no_video" };
  const moov = child(buf, 0, buf.length, "moov");
  if (!moov) return { ok: false, code: "unreadable" };
  const mvhd = child(buf, moov[1], moov[2], "mvhd");
  if (!mvhd) return { ok: false, code: "unreadable" };
  const p = mvhd[1];
  const version = buf[p];
  let timescale: number, duration: number;
  if (version === 1) {
    if (p + 32 > mvhd[2]) return { ok: false, code: "unreadable" };
    timescale = u32(buf, p + 20);
    duration = u32(buf, p + 24) * 2 ** 32 + u32(buf, p + 28);
  } else {
    if (p + 20 > mvhd[2]) return { ok: false, code: "unreadable" };
    timescale = u32(buf, p + 12);
    duration = u32(buf, p + 16);
  }
  if (!timescale || !Number.isFinite(duration)) return { ok: false, code: "unreadable" };
  // A real video needs at least one track whose handler is "vide".
  let hasVideo = false;
  for (const [type, s, e] of boxes(buf, moov[1], moov[2])) {
    if (type !== "trak") continue;
    const mdia = child(buf, s, e, "mdia");
    const hdlr = mdia && child(buf, mdia[1], mdia[2], "hdlr");
    if (hdlr && hdlr[1] + 12 <= hdlr[2] && fourcc(buf, hdlr[1] + 8) === "vide") hasVideo = true;
  }
  if (!hasVideo) return { ok: false, code: "no_video" };
  const durationSec = Math.round((duration / timescale) * 10) / 10;
  if (durationSec < MIN_VIDEO_SECONDS) return { ok: false, code: "too_short" };
  if (durationSec > MAX_VIDEO_SECONDS) return { ok: false, code: "too_long" };
  return { ok: true, mime, durationSec };
}

/** Poster frame captured in the browser. Only JPEG/WebP/PNG, checked by magic bytes. */
export function checkPoster(buf: Uint8Array): { ok: true; mime: string } | { ok: false } {
  if (!buf.length || buf.length > MAX_POSTER_BYTES) return { ok: false };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ok: true, mime: "image/jpeg" };
  if (fourcc(buf, 0) === "RIFF" && fourcc(buf, 8) === "WEBP") return { ok: true, mime: "image/webp" };
  if (buf[0] === 0x89 && fourcc(buf, 1) === "PNG") return { ok: true, mime: "image/png" };
  return { ok: false };
}
