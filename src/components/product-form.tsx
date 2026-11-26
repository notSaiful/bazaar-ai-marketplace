"use client";
import { useRef, useState } from "react";
import { AiDemoBadge } from "./ai-demo-badge";
import { Camera, Loader2, RotateCcw } from "lucide-react";
import { saveProductAction } from "@/app/actions";
import { CATEGORIES } from "@/lib/catalog";
import { btn, inputCls, ProductArt } from "./ui";
import { cn } from "@/lib/utils";
import type { ListingDraft } from "@/lib/ai";
import { localizeMsg } from "@/lib/dict/seller";
import { useLang, useT } from "./lang";

export interface FormInitial {
  id?: string; title: string; titleHi: string; description: string; descriptionHi: string; category: string; tags: string; attributes: string;
  price: string; mrp: string; stock: string; hue: number; emoji: string; image?: string; aiGenerated?: boolean;
}
export const EMPTY: FormInitial = { title: "", titleHi: "", description: "", descriptionHi: "", category: "home", tags: "", attributes: "", price: "", mrp: "", stock: "10", hue: 20, emoji: "📦" };

const SAMPLES = [
  { label: "Brass diya", key: "seller.form.sample.diya", file: "brass-diya.jpg", emoji: "🪔", hue: 42 },
  { label: "Cotton kurta", key: "seller.form.sample.kurta", file: "cotton-kurta.jpg", emoji: "👘", hue: 20 },
  { label: "Silver jhumka", key: "seller.form.sample.jhumka", file: "silver-jhumka.jpg", emoji: "✨", hue: 335 },
  { label: "Masala chai", key: "seller.form.sample.chai", file: "masala-chai.jpg", emoji: "☕", hue: 30 },
];

async function downscale(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const max = 640, k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.8);
}

export function ProductForm({ initial = EMPTY, studio = false, canPublish = true, aiLive = false }: { initial?: FormInitial; studio?: boolean; canPublish?: boolean; aiLive?: boolean }) {
  const t = useT();
  const lang = useLang();
  const [f, setF] = useState<FormInitial>(initial);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [, setStarted] = useState<number | null>(null);
  const [secs, setSecs] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof FormInitial>(k: K, v: FormInitial[K]) => setF((x) => ({ ...x, [k]: v }));

  async function analyse(input: { file?: File; filename: string; sample?: (typeof SAMPLES)[number] }) {
    const t0 = Date.now();
    setBusy(true); setErr(null); setDraft(null); setSecs(null);
    setStarted((s) => s ?? Date.now());
    try {
      let dataUrl: string | undefined;
      if (input.file) { dataUrl = await downscale(input.file); setPreview(dataUrl); }
      else if (input.sample) setPreview(`/api/art?h=${input.sample.hue}&e=${encodeURIComponent(input.sample.emoji)}`);
      const r = await fetch("/api/ai/listing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ imageDataUrl: dataUrl, filename: input.filename, hint: "" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "AI request failed");
      const d = j as ListingDraft;
      setDraft(d);
      setSecs(Math.max(1, Math.round((Date.now() - t0) / 1000)));
      if (!d.retake) {
        setF((x) => ({
          ...x, title: d.title, titleHi: d.titleHi, description: d.description, descriptionHi: d.descriptionHi, category: d.category,
          tags: d.tags.join(", "), attributes: Object.entries(d.attributes).map(([k, v]) => `${k}: ${v}`).join("\n"),
          emoji: d.emoji, hue: d.hue, image: dataUrl, aiGenerated: true,
          price: x.price || String(Math.round((d.priceHintMin + d.priceHintMax) / 2 / 10) * 10),
          mrp: x.mrp || String(Math.round(((d.priceHintMin + d.priceHintMax) / 2) * 1.3 / 10) * 10),
        }));
      }
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  const reviewed = !!draft && !draft.retake;
  const showPhoto = studio;
  const label = "mb-1 block text-sm text-muted";
  return (
    <form action={saveProductAction} className="space-y-8">
      {f.id && <input type="hidden" name="id" value={f.id} />}
      <input type="hidden" name="hue" value={f.hue} /><input type="hidden" name="emoji" value={f.emoji} />
      {f.image && <input type="hidden" name="image" value={f.image} />}
      {f.aiGenerated && <input type="hidden" name="aiGenerated" value="1" />}

      {showPhoto && (
        <section className="space-y-4">
          {!aiLive && <div className="flex justify-end"><AiDemoBadge /></div>}
          <div className="grid aspect-[2/1] place-items-center overflow-hidden rounded-3xl border border-dashed border-line bg-surface2">
            {preview ? <div className="h-full"><ProductArt src={preview} alt={t("seller.form.photoAlt")} className="h-full w-auto" /></div> : <p className="px-6 text-center text-muted">{t("seller.form.photoPrompt")}</p>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" id="photo" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setStarted(Date.now()); analyse({ file, filename: file.name }); } }} />
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="photo" className={cn(btn(reviewed ? "outline" : "primary", "lg"), "cursor-pointer")}><Camera className="size-5" /> {preview ? t("seller.form.differentPhoto") : t("seller.form.takePhoto")}</label>
            {draft?.retake && <button type="button" onClick={() => fileRef.current?.click()} className={btn("outline", "lg")}><RotateCcw className="size-4" /> {t("seller.form.retake")}</button>}
            {!preview && <span className="text-sm text-muted">{t("seller.form.trySample")} {SAMPLES.map((s, i) => <span key={s.label}>{i > 0 && ", "}<button type="button" disabled={busy} onClick={() => { setStarted(Date.now()); analyse({ filename: s.file, sample: s }); }} className="underline hover:text-fg">{t(s.key)}</button></span>)}</span>}
          </div>
          {busy && <p className="flex items-center gap-2 text-sm text-muted" role="status"><Loader2 className="size-4 animate-spin" /> {t("seller.form.writing")}</p>}
          {err && <p role="alert" className="text-sm text-bad">{localizeMsg(err, lang)}</p>}
          {draft?.retake && <p role="alert" className="rounded-lg bg-warn/10 px-3 py-2 text-sm text-warn">{draft.retakeReason ? localizeMsg(draft.retakeReason, lang) : t("seller.form.unclear")}</p>}
          {reviewed && draft && <p className="text-sm text-muted">{secs !== null ? t("seller.form.draftReadyIn", { n: secs, min: draft.priceHintMin, max: draft.priceHintMax }) : t("seller.form.draftReady", { min: draft.priceHintMin, max: draft.priceHintMax })}</p>}
        </section>
      )}

      {(!studio || reviewed || f.title) && (
        <section className="space-y-6">
          <div><label htmlFor="title" className={label}>{t("seller.form.name")}</label><input id="title" name="title" required value={f.title} onChange={(e) => set("title", e.target.value)} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="price" className={label}>{t("seller.form.price")}</label><input id="price" name="price" type="number" min={1} step="1" required value={f.price} onChange={(e) => set("price", e.target.value)} className={inputCls} /></div>
            <div><label htmlFor="stock" className={label}>{t("seller.form.stock")}</label><input id="stock" name="stock" type="number" min={0} step="1" required value={f.stock} onChange={(e) => set("stock", e.target.value)} className={inputCls} /></div>
          </div>
          <details open={!studio} className="rounded-2xl border border-line p-4">
            <summary className="cursor-pointer text-sm text-muted hover:text-fg">{t("seller.form.more")}</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div><label htmlFor="titleHi" className={label}>नाम (हिंदी)</label><input id="titleHi" name="titleHi" lang="hi" value={f.titleHi} onChange={(e) => set("titleHi", e.target.value)} className={inputCls} /></div>
              <div><label htmlFor="category" className={label}>{t("seller.form.category")}</label><select id="category" name="category" value={f.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{lang === "hi" ? c.nameHi : c.name}</option>)}</select></div>
              <div><label htmlFor="description" className={label}>{t("seller.form.description")}</label><textarea id="description" name="description" rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} className={cn(inputCls, "h-auto py-2")} /></div>
              <div><label htmlFor="descriptionHi" className={label}>विवरण (हिंदी)</label><textarea id="descriptionHi" name="descriptionHi" lang="hi" rows={4} value={f.descriptionHi} onChange={(e) => set("descriptionHi", e.target.value)} className={cn(inputCls, "h-auto py-2")} /></div>
              <div><label htmlFor="mrp" className={label}>{t("seller.form.mrp")}</label><input id="mrp" name="mrp" type="number" min={0} step="1" value={f.mrp} onChange={(e) => set("mrp", e.target.value)} className={inputCls} /></div>
              <div><label htmlFor="tags" className={label}>{t("seller.form.tags")}</label><input id="tags" name="tags" value={f.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} /></div>
              <div className="md:col-span-2"><label htmlFor="attributes" className={label}>{t("seller.form.attributes")}</label><textarea id="attributes" name="attributes" rows={3} value={f.attributes} onChange={(e) => set("attributes", e.target.value)} className={cn(inputCls, "h-auto py-2 font-mono")} /></div>
            </div>
          </details>
          <div className="flex flex-wrap items-center gap-4">
            <button name="publish" value="1" disabled={!canPublish} className={btn("primary", "lg")}>{t("seller.form.publish")}</button>
            <button name="publish" value="0" className="text-sm text-muted underline hover:text-fg">{t("seller.form.saveDraft")}</button>
            {!canPublish && <span className="text-sm text-warn">{t("seller.form.publishLocked")}</span>}
          </div>
        </section>
      )}
    </form>
  );
}
