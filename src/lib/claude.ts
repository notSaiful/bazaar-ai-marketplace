/**
 * Single entry point for Claude calls (official Anthropic SDK, structured outputs).
 *
 * - Off unless ANTHROPIC_API_KEY is set explicitly (AI_MODE=mock forces it off), so evals, e2e and the demo
 *   stay deterministic. Every caller has a non-AI fallback; AI output is a proposal the server re-checks.
 * - Structured outputs (Zod) so replies always match a schema; the result is validated again here.
 * - Server-side refusal fallbacks are enabled ("default" routing), and refusals/timeouts/errors return a
 *   reason instead of throwing.
 * - Tests inject a fake with setFakeClaude(); nothing goes over the network in evals.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY && process.env.AI_MODE !== "mock";
export const aiModel = () => process.env.AI_MODEL || "claude-opus-5-5";

export interface StructuredCall<T> {
  /** Short name for logs and traces, e.g. "assistant", "listing". */
  task: string;
  schema: z.ZodType<T>;
  system: string;
  content: string | Anthropic.Beta.BetaContentBlockParam[];
  effort?: "low" | "medium" | "high";
  timeoutMs?: number;
}
export type StructuredResult<T> =
  | { ok: true; data: T; ms: number; model: string }
  | { ok: false; reason: "disabled" | "refusal" | "invalid" | "timeout" | "error"; ms: number };

/** Test seam: return the object the model would produce, throw to simulate an error, or "REFUSAL". */
export type FakeClaude = (call: StructuredCall<unknown>) => unknown | Promise<unknown>;
const G = globalThis as unknown as { __bzFakeClaude?: FakeClaude; __bzClaude?: Anthropic };
export const setFakeClaude = (f?: FakeClaude) => { G.__bzFakeClaude = f; };

export async function structured<T>(call: StructuredCall<T>): Promise<StructuredResult<T>> {
  const t0 = Date.now();
  const fake = G.__bzFakeClaude;
  if (!fake && !aiEnabled()) return { ok: false, reason: "disabled", ms: 0 };
  try {
    let out: unknown;
    if (fake) {
      out = await fake(call as StructuredCall<unknown>);
      if (out === "REFUSAL") return { ok: false, reason: "refusal", ms: Date.now() - t0 };
    } else {
      const client = (G.__bzClaude ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 1 }));
      const res = await client.beta.messages.parse(
        {
          model: aiModel(),
          max_tokens: 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: call.effort ?? "low", format: betaZodOutputFormat(call.schema) },
          system: call.system,
          messages: [{ role: "user", content: call.content }],
        },
        { timeout: call.timeoutMs ?? 20_000 },
      );
      if (res.stop_reason === "refusal") return { ok: false, reason: "refusal", ms: Date.now() - t0 };
      if (res.stop_reason === "max_tokens") return { ok: false, reason: "invalid", ms: Date.now() - t0 };
      out = res.parsed_output;
    }
    const v = call.schema.safeParse(out);
    if (!v.success) return { ok: false, reason: "invalid", ms: Date.now() - t0 };
    return { ok: true, data: v.data, ms: Date.now() - t0, model: fake ? "fake" : aiModel() };
  } catch (e) {
    const timeout = e instanceof Anthropic.APIConnectionTimeoutError;
    if (!fake) console.warn(`[claude] ${call.task} failed:`, e instanceof Anthropic.APIError ? `${e.status} ${e.name}` : timeout ? "timeout" : (e as Error)?.name);
    return { ok: false, reason: timeout ? "timeout" : "error", ms: Date.now() - t0 };
  }
}
