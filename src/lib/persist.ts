import { cookies } from "next/headers";
import { chunkNames, encodeLog } from "./state";
import { exportLog, isDirty, markClean } from "./store";

const base = () => ({ httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });

/**
 * Writes this visitor's mutation log to the signed state cookie. Call once at the end of every
 * request that mutates state (server actions, POST route handlers). No-op when nothing changed.
 */
export async function persistState(): Promise<void> {
  if (!isDirty()) return;
  const chunks = encodeLog(exportLog());
  if (chunks === null) throw new Error("Your demo session is full. Open Admin and choose “Reset demo data”.");
  const jar = await cookies();
  const names = chunkNames();
  names.forEach((n, i) => {
    if (i < chunks.length) jar.set(n, chunks[i], base());
    else if (jar.get(n)) jar.set(n, "", { ...base(), maxAge: 0 });
  });
  markClean();
}

/** Runs a mutating handler and persists state afterwards (also when it redirects). */
export async function withState<T>(fn: () => Promise<T> | T): Promise<T> {
  try {
    return await fn();
  } finally {
    await persistState();
  }
}
