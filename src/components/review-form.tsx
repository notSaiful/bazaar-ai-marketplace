"use client";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReviewAction, type ReviewFormState } from "@/app/actions";
import { cn } from "@/lib/utils";
import { btn, inputCls } from "./ui";
import { useT } from "./lang";

const LABELS = ["", "shop.rf.l1", "shop.rf.l2", "shop.rf.l3", "shop.rf.l4", "shop.rf.l5"];

/** The review action replies in English; map its known messages to dictionary keys so Hindi visitors see Hindi. */
const SERVER_MSG: Record<string, string> = {
  "Switch to Shopping to write a review.": "shop.reviews.switch",
  "You're posting reviews very fast. Please wait a minute.": "shop.rf.tooFast",
  "Thanks! Your review is waiting for a quick check by our team before it appears.": "shop.reviews.held",
  "Thanks! Your review is live.": "shop.rf.live",
  "This product is not available for reviews.": "shop.rf.unavailable",
  "Choose a rating from 1 to 5 stars.": "shop.rf.chooseRating",
  "Enter a name between 2 and 40 characters.": "shop.rf.nameLength",
  "Write at least 10 characters about the product.": "shop.rf.tooShort",
  "Keep the review under 600 characters.": "shop.rf.tooLong",
  "You have already reviewed this product.": "shop.rf.already",
};

export function ReviewForm({ productId, defaultName }: { productId: string; defaultName: string }) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(submitReviewAction, {});
  const t = useT();
  const msg = (m: string) => (SERVER_MSG[m] ? t(SERVER_MSG[m]) : m);
  return (
    <form action={action} className="space-y-4 rounded-xl border border-line bg-surface p-5" aria-labelledby="write-review">
      <h3 id="write-review" className="text-base font-semibold">{t("shop.rf.title")}</h3>
      <input type="hidden" name="productId" value={productId} />
      {/* Remounting on each successful post clears the stars, counter and text without an effect. */}
      <Fields key={state.nonce ?? 0} defaultName={defaultName} />
      {state.error && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{msg(state.error)}</p>}
      {state.ok && <p role="status" className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">{msg(state.ok)}</p>}
      <button disabled={pending} className={cn(btn("primary", "lg"), "w-full sm:w-auto")}>{pending ? t("shop.rf.posting") : t("shop.rf.post")}</button>
    </form>
  );
}

function Fields({ defaultName }: { defaultName: string }) {
  const t = useT();
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
        <legend className="mb-2 text-sm font-medium">{t("shop.rf.yourRating")}</legend>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
                <input type="radio" name="stars" value={n} checked={stars === n} onChange={() => setStars(n)} className="peer sr-only" required />
                <span className="sr-only">{t(n === 1 ? "shop.rf.star.one" : "shop.rf.star.many", { n })}</span>
                <Star aria-hidden className={cn("size-7 transition peer-focus-visible:scale-110 peer-focus-visible:drop-shadow", n <= shown ? "fill-fg text-fg" : "text-line")} />
              </label>
            ))}
          </div>
          <span className="text-sm text-muted" aria-live="polite">{LABELS[shown] ? t(LABELS[shown]) : ""}</span>
        </div>
      </fieldset>
      <div>
        <label htmlFor="rv-author" className="mb-1.5 block text-sm font-medium">{t("shop.rf.name")}</label>
        <input id="rv-author" name="author" value={author} onChange={(e) => setAuthor(e.target.value)} required minLength={2} maxLength={40} autoComplete="name" className={cn(inputCls, "h-10")} />
      </div>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="rv-text" className="text-sm font-medium">{t("shop.rf.text")}</label>
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
          placeholder={t("shop.rf.placeholder")}
          className={cn(inputCls, "h-auto resize-y py-2 leading-relaxed")}
        />
      </div>
    </>
  );
}
