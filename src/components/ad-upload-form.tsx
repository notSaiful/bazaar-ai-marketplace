"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Film, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "./lang";
import { btn, inputCls } from "./ui";

interface Limits { maxBytes: number; minSec: number; maxSec: number; maxCaption: number }
const TYPES = ["video/mp4", "video/quicktime"];

/** Draw a 540x960 "cover" frame from the chosen video for the feed poster (WebP, small). */
async function capturePoster(v: HTMLVideoElement): Promise<Blob | null> {
  const c = document.createElement("canvas");
  c.width = 540;
  c.height = 960;
  const g = c.getContext("2d");
  if (!g || !v.videoWidth) return null;
  const s = Math.max(540 / v.videoWidth, 960 / v.videoHeight);
  const w = v.videoWidth * s, h = v.videoHeight * s;
  g.drawImage(v, (540 - w) / 2, (960 - h) / 2, w, h);
  return new Promise((res) => c.toBlob((b) => res(b), "image/webp", 0.7));
}

/**
 * Seller "Upload ad" form. Client checks (type, size, length) are only for quick feedback;
 * the server re-checks the real bytes, duration and caption.
 */
export function AdUploadForm({ products, limits }: { products: { id: string; title: string }[]; limits: Limits }) {
  const t = useT();
  const router = useRouter();
  const preview = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [poster, setPoster] = useState<Blob | null>(null);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError(null); setOk(null); setDuration(null); setPoster(null);
    if (url) URL.revokeObjectURL(url);
    setUrl(null); setFile(null);
    if (!f) return;
    if (!TYPES.includes(f.type)) { setError(t("seller.ads.err.type")); return; }
    if (f.size > limits.maxBytes) { setError(t("seller.ads.err.too_big")); return; }
    setFile(f);
    setUrl(URL.createObjectURL(f));
  }

  async function onMeta() {
    const v = preview.current;
    if (!v) return;
    const d = v.duration;
    setDuration(Number.isFinite(d) ? Math.round(d * 10) / 10 : null);
    if (d < limits.minSec) setError(t("seller.ads.err.too_short"));
    else if (d > limits.maxSec) setError(t("seller.ads.err.too_long"));
    // Grab a frame a little in, past any fade from black.
    v.currentTime = Math.min(1.5, d / 2);
  }

  async function onSeeked() {
    const v = preview.current;
    if (v && !poster) setPoster(await capturePoster(v));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!file || busy) return;
    setBusy(true); setError(null); setOk(null); setProgress(0);
    const fd = new FormData();
    fd.set("video", file);
    if (poster) fd.set("poster", poster, "poster.webp");
    fd.set("productId", productId);
    fd.set("caption", caption);
    // XHR (not fetch) so a phone on slow data sees upload progress.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/seller/ads");
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(ev.loaded / ev.total);
    xhr.onload = () => {
      setBusy(false);
      let body: { ok?: boolean; held?: boolean; error?: string } = {};
      try { body = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.ok) {
        setOk(body.held ? t("seller.ads.held") : t("seller.ads.live"));
        setFile(null); setCaption(""); setDuration(null); setPoster(null);
        if (url) URL.revokeObjectURL(url);
        setUrl(null);
        router.refresh();
      } else setError(body.error ?? t("seller.ads.err.network"));
    };
    xhr.onerror = () => { setBusy(false); setError(t("seller.ads.err.network")); };
    xhr.send(fd);
  }

  const tooLong = duration !== null && (duration > limits.maxSec || duration < limits.minSec);
  return (
    <form onSubmit={submit} className="grid gap-6 rounded-xl border border-line bg-surface p-5 md:grid-cols-[200px_1fr]" aria-labelledby="upload-ad">
      <div className="mx-auto w-full max-w-[200px]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-surface2">
          {url ? (
            <video ref={preview} src={url} muted playsInline controls preload="metadata" onLoadedMetadata={onMeta} onSeeked={onSeeked} aria-label={t("seller.ads.preview")} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted"><Film className="size-8" aria-hidden /></div>
          )}
        </div>
        {duration !== null && <p className={cn("mt-2 text-center text-xs tabular-nums", tooLong ? "text-bad" : "text-muted")}>{t("seller.ads.length", { n: duration })}</p>}
      </div>
      <div className="space-y-4">
        <h2 id="upload-ad" className="text-base font-semibold">{t("seller.ads.upload")}</h2>
        <div>
          <label htmlFor="ad-video" className="mb-1.5 block text-sm font-medium">{t("seller.ads.video")}</label>
          <input id="ad-video" type="file" accept="video/mp4,video/quicktime" onChange={pick} required className="block w-full text-sm file:mr-3 file:h-10 file:rounded-lg file:border file:border-line file:bg-surface2 file:px-3 file:text-sm file:font-medium" />
          <p className="mt-1.5 text-xs text-muted">{t("seller.ads.videoHint", { min: limits.minSec, max: limits.maxSec, mb: Math.round(limits.maxBytes / 1048576) })}</p>
        </div>
        <div>
          <label htmlFor="ad-product" className="mb-1.5 block text-sm font-medium">{t("seller.ads.product")}</label>
          <select id="ad-product" value={productId} onChange={(e) => setProductId(e.target.value)} required className={cn(inputCls, "h-10")}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="ad-caption" className="text-sm font-medium">{t("seller.ads.caption")}</label>
            <span className={cn("text-xs tabular-nums", caption.length > limits.maxCaption ? "text-bad" : "text-muted")}>{caption.length}/{limits.maxCaption}</span>
          </div>
          <textarea id="ad-caption" value={caption} onChange={(e) => setCaption(e.target.value)} required minLength={3} maxLength={limits.maxCaption} rows={3} placeholder={t("seller.ads.captionPh")} className={cn(inputCls, "h-auto resize-y py-2 leading-relaxed")} />
        </div>
        {busy && (
          <div className="h-1.5 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label={t("seller.ads.uploading")}>
            <div className="h-full bg-fg transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}
        {error && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
        {ok && <p role="status" className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">{ok}</p>}
        <button disabled={!file || busy || tooLong || !productId} className={cn(btn("primary", "lg"), "w-full sm:w-auto")}>
          <Upload className="size-4" aria-hidden /> {busy ? t("seller.ads.uploading") : t("seller.ads.submit")}
        </button>
      </div>
    </form>
  );
}
