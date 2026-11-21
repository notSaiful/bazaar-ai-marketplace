"use client";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReviewAction, type ReviewFormState } from "@/app/actions";
import { cn } from "@/lib/utils";
import { btn, inputCls } from "./ui";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function ReviewForm({ productId, defaultName }: { productId: string; defaultName: string }) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(submitReviewAction, {});
  return (
    <form action={action} className="space-y-4 rounded-xl border border-line bg-surface p-5" aria-labelledby="write-review">
      <h3 id="write-review" className="text-base font-semibold">Write a review</h3>
      <input type="hidden" name="productId" value={productId} />
      {/* Remounting on each successful post clears the stars, counter and text without an effect. */}
      <Fields key={state.nonce ?? 0} defaultName={defaultName} />
      {state.error && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">{state.ok}</p>}
      <button disabled={pending} className={cn(btn("primary", "lg"), "w-full sm:w-auto")}>{pending ? "Posting…" : "Post review"}</button>
    </form>
  );
}

function Fields({ defaultName }: { defaultName: string }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  // Controlled so a validation error (React resets uncontrolled fields after every action) keeps the text.
  const [author, setAuthor] = useState(defaultName);
  const [text, setText] = useState("");
  const len = text.length;
  const shown = hover || stars;
  return (
    <>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Your rating</legend>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
                <input type="radio" name="stars" value={n} checked={stars === n} onChange={() => setStars(n)} className="peer sr-only" required />
                <span className="sr-only">{n} {n === 1 ? "star" : "stars"}</span>
                <Star aria-hidden className={cn("size-7 transition peer-focus-visible:scale-110 peer-focus-visible:drop-shadow", n <= shown ? "fill-fg text-fg" : "text-line")} />
              </label>
            ))}
          </div>
          <span className="text-sm text-muted" aria-live="polite">{LABELS[shown]}</span>
        </div>
      </fieldset>
      <div>
        <label htmlFor="rv-author" className="mb-1.5 block text-sm font-medium">Name shown with your review</label>
        <input id="rv-author" name="author" value={author} onChange={(e) => setAuthor(e.target.value)} required minLength={2} maxLength={40} autoComplete="name" className={cn(inputCls, "h-10")} />
      </div>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="rv-text" className="text-sm font-medium">Your review</label>
          <span className={cn("text-xs tabular-nums", len > 600 ? "text-bad" : "text-muted")}>{len}/600</span>
        </div>
        <textarea
          id="rv-text"
          name="text"
          required
          minLength={10}
          maxLength={600}
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Quality, fit, packing, delivery… English, Hindi or Hinglish is fine."
          className={cn(inputCls, "h-auto resize-y py-2 leading-relaxed")}
        />
      </div>
    </>
  );
}
