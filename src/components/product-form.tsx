"use client";
import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles, Upload, RotateCcw, Wand2 } from "lucide-react";
import { saveProductAction } from "@/app/actions";
import { CATEGORIES } from "@/lib/catalog";
import { btn, Badge, Card, inputCls, ProductArt } from "./ui";
import { cn } from "@/lib/utils";
import type { ListingDraft } from "@/lib/ai";

export interface FormInitial {
  id?: string; title: string; titleHi: string; description: string; descriptionHi: string; category: string; tags: string; attributes: string;
  price: string; mrp: string; stock: string; hue: number; emoji: string; image?: string; aiGenerated?: boolean;
}
export const EMPTY: FormInitial = { title: "", titleHi: "", description: "", descriptionHi: "", category: "home", tags: "", attributes: "", price: "", mrp: "", stock: "10", hue: 20, emoji: "📦" };

const SAMPLES = [
  { label: "Brass diya", file: "brass-diya.jpg", emoji: "🪔", hue: 42 },
  { label: "Cotton kurta", file: "cotton-kurta.jpg", emoji: "👘", hue: 20 },
  { label: "Silver jhumka", file: "silver-jhumka.jpg", emoji: "✨", hue: 335 },
  { label: "Masala chai", file: "masala-chai.jpg", emoji: "☕", hue: 30 },
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

export function ProductForm({ initial = EMPTY, studio = false, canPublish = true }: { initial?: FormInitial; studio?: boolean; canPublish?: boolean }) {
  const [f, setF] = useState<FormInitial>(initial);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [started, setStarted] = useState<number | null>(null);
  const [secs, setSecs] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof FormInitial>(k: K, v: FormInitial[K]) => setF((x) => ({ ...x, [k]: v }));

  async function analyse(input: { file?: File; filename: string; sample?: (typeof SAMPLES)[number] }) {
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
  return (
    <form action={saveProductAction} className="space-y-6">
      {f.id && <input type="hidden" name="id" value={f.id} />}
      <input type="hidden" name="hue" value={f.hue} /><input type="hidden" name="emoji" value={f.emoji} />
      {f.image && <input type="hidden" name="image" value={f.image} />}
      {f.aiGenerated && <input type="hidden" name="aiGenerated" value="1" />}

      {studio && (
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Camera className="size-5 text-accent" /> Start with a photo</h2>{started && secs !== null && <Badge tone="ok">Draft ready in {secs}s</Badge>}</div>
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-dashed border-line bg-surface2">
              {preview ? <ProductArt src={preview} alt="Uploaded product" /> : <div className="p-4 text-center text-sm text-muted"><Upload className="mx-auto mb-2 size-8" />Take or upload a photo</div>}
            </div>
            <div className="space-y-3">
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" id="photo" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setStarted(Date.now()); analyse({ file, filename: file.name }); } }} />
              <div className="flex flex-wrap gap-2">
                <label htmlFor="photo" className={cn(btn("primary", "lg"), "cursor-pointer")}><Camera className="size-5" /> Take / upload photo</label>
                {draft?.retake && <button type="button" onClick={() => fileRef.current?.click()} className={btn("outline", "lg")}><RotateCcw className="size-4" /> Retake</button>}
              </div>
              <div><div className="mb-1 text-xs text-muted">No photo handy? Use a pre-cached sample (instant demo):</div>
                <div className="flex flex-wrap gap-2">{SAMPLES.map((s) => <button key={s.label} type="button" disabled={busy} onClick={() => { setStarted(Date.now()); analyse({ filename: s.file, sample: s }); }} className="rounded-full border border-line bg-surface px-3 py-1 text-sm hover:bg-surface2">{s.emoji} {s.label}</button>)}</div></div>
              {busy && <p className="flex items-center gap-2 text-sm text-muted" role="status"><Loader2 className="size-4 animate-spin" /> Analysing photo, writing English + Hindi copy…</p>}
              {err && <p role="alert" className="text-sm text-bad">{err}</p>}
              {draft?.retake && <p role="alert" className="rounded-lg bg-warn/15 px-3 py-2 text-sm text-warn">{draft.retakeReason ?? "The photo is unclear. Please retake."}</p>}
              {reviewed && draft && (
                <div className="rounded-xl bg-accent-soft p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2 font-medium text-accent"><Sparkles className="size-4" /> AI draft · confidence {Math.round(draft.confidence * 100)}% · {draft.source === "llm" ? "vision model" : "demo mode"} · {draft.latencyMs} ms</div>
                  <p className="mt-1 text-muted">Why: {draft.whyThis}. Price hint ₹{draft.priceHintMin}–₹{draft.priceHintMax} is only a suggestion: <b>you set the final price</b>. Nothing publishes until you confirm.</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Listing details</h2>{f.aiGenerated && <Badge tone="accent"><Wand2 className="size-3" /> AI-assisted · edit anything</Badge>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label htmlFor="title" className="mb-1 block text-sm font-medium">Title (English)</label><input id="title" name="title" required value={f.title} onChange={(e) => set("title", e.target.value)} className={inputCls} /></div>
          <div><label htmlFor="titleHi" className="mb-1 block text-sm font-medium">शीर्षक (हिंदी)</label><input id="titleHi" name="titleHi" lang="hi" value={f.titleHi} onChange={(e) => set("titleHi", e.target.value)} className={inputCls} /></div>
          <div><label htmlFor="description" className="mb-1 block text-sm font-medium">Description (English)</label><textarea id="description" name="description" rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} className={cn(inputCls, "h-auto py-2")} /></div>
          <div><label htmlFor="descriptionHi" className="mb-1 block text-sm font-medium">विवरण (हिंदी)</label><textarea id="descriptionHi" name="descriptionHi" lang="hi" rows={4} value={f.descriptionHi} onChange={(e) => set("descriptionHi", e.target.value)} className={cn(inputCls, "h-auto py-2")} /></div>
          <div><label htmlFor="category" className="mb-1 block text-sm font-medium">Category</label><select id="category" name="category" value={f.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
          <div><label htmlFor="tags" className="mb-1 block text-sm font-medium">Search tags (English + Hinglish)</label><input id="tags" name="tags" value={f.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} /></div>
          <div className="md:col-span-2"><label htmlFor="attributes" className="mb-1 block text-sm font-medium">Attributes (one per line, “Name: value”)</label><textarea id="attributes" name="attributes" rows={3} value={f.attributes} onChange={(e) => set("attributes", e.target.value)} className={cn(inputCls, "h-auto py-2 font-mono")} /></div>
          <div><label htmlFor="price" className="mb-1 block text-sm font-medium">Selling price (₹) <span className="text-muted">· you decide</span></label><input id="price" name="price" type="number" min={1} step="1" required value={f.price} onChange={(e) => set("price", e.target.value)} className={inputCls} /></div>
          <div><label htmlFor="mrp" className="mb-1 block text-sm font-medium">MRP (₹)</label><input id="mrp" name="mrp" type="number" min={0} step="1" value={f.mrp} onChange={(e) => set("mrp", e.target.value)} className={inputCls} /></div>
          <div><label htmlFor="stock" className="mb-1 block text-sm font-medium">Stock</label><input id="stock" name="stock" type="number" min={0} step="1" required value={f.stock} onChange={(e) => set("stock", e.target.value)} className={inputCls} /></div>
        </div>
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <button name="publish" value="1" disabled={!canPublish || (studio && !reviewed && !f.title)} className={btn("primary", "lg")}>{studio ? "I've reviewed it: publish" : "Save & publish"}</button>
        <button name="publish" value="0" className={btn("outline", "lg")}>Save as draft</button>
        {!canPublish && <span className="text-sm text-warn">Publishing is locked until your store is approved.</span>}
      </div>
    </form>
  );
}
