import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createAd, rateLimit } from "@/lib/store";
import { withState } from "@/lib/persist";
import { t } from "@/lib/i18n";
import { checkPoster, checkVideo, MAX_POSTER_BYTES, MAX_VIDEO_BYTES } from "@/lib/video";
import { deleteMedia, newMediaKey, putMedia } from "@/lib/media-store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Seller uploads a short video ad. Everything the browser sends is untrusted: the file type is read from
 * the bytes, the duration from the MP4/MOV header, and the caption is cleaned and screened in the store.
 */
export async function POST(req: Request) {
  return withState(async () => {
    const s = await getSession();
    const L = s.lang;
    const fail = (code: string, status = 400) => NextResponse.json({ error: t(`seller.ads.err.${code}`, L), code }, { status });
    if (s.role !== "seller") return fail("role", 403);
    if (!rateLimit(`ad:${s.sellerId}`, 5)) return fail("rate", 429);
    // Reject oversized bodies before buffering them.
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > MAX_VIDEO_BYTES + MAX_POSTER_BYTES + 64 * 1024) return fail("too_big", 413);

    const form = await req.formData().catch(() => null);
    if (!form) return fail("unreadable");
    const video = form.get("video");
    if (!(video instanceof File)) return fail("empty");
    if (video.size > MAX_VIDEO_BYTES) return fail("too_big", 413);
    const bytes = new Uint8Array(await video.arrayBuffer());
    const check = checkVideo(bytes, video.type);
    if (!check.ok) return fail(check.code);

    let posterKey: string | undefined;
    const poster = form.get("poster");
    if (poster instanceof File && poster.size > 0) {
      const pb = new Uint8Array(await poster.arrayBuffer());
      const pc = checkPoster(pb);
      if (pc.ok) {
        posterKey = newMediaKey("img");
        putMedia(posterKey, pb, pc.mime);
      }
    }
    const videoKey = newMediaKey("vid");
    putMedia(videoKey, bytes, check.mime);

    const r = createAd(s.sellerId, {
      productId: String(form.get("productId") ?? ""),
      caption: String(form.get("caption") ?? ""),
      durationSec: check.durationSec,
      mime: check.mime,
      sizeBytes: bytes.length,
      videoKey,
      posterKey,
    });
    if ("error" in r) {
      deleteMedia(videoKey);
      if (posterKey) deleteMedia(posterKey);
      return fail(r.code);
    }
    revalidatePath("/samples");
    revalidatePath("/seller/ads");
    return NextResponse.json({ ok: true, id: r.ad.id, held: r.held, durationSec: r.ad.durationSec });
  });
}
