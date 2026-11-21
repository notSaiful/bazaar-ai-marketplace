"use client";
import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted">The page couldn&apos;t load. Your cart is safe.</p>
      <div className="flex justify-center gap-3">
        <button onClick={reset} className="rounded-xl bg-accent px-4 py-2 text-accent-fg">Try again</button>
        <Link href="/" className="rounded-xl border border-line px-4 py-2">Home</Link>
      </div>
    </div>
  );
}
