import { createServerFn } from "@tanstack/react-start";
import { randomBytes } from "crypto";
import { credentialsSchema, stateSchema, messageSchema, exposureSchema } from "./demo/schemas";
import { z } from "zod";
import { demoProviders } from "./demo/providers";

export const createDemoSession = createServerFn({ method: "POST" }).handler(async () => {
  const { hashSecret } = await import("./demo/session.server");
  const secret = randomBytes(32).toString("base64url");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("demo_sessions")
    .insert({
      secret_hash: hashSecret(secret),
      state: {
        step: "input",
        belief: "",
        messages: [],
        clarificationCount: 0,
        interpretation: "",
        exposures: [],
        assets: [],
        investments: [],
      },
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Demo session unavailable");
  return { id: data.id, secret };
});

export const loadDemoSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const { verifiedSession } = await import("./demo/session.server");
    const session = await verifiedSession(data);
    return session ? { ok: true as const, state: session.state } : { ok: false as const };
  });

export const saveDemoSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ ...credentialsSchema.shape, state: stateSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { verifiedSession } = await import("./demo/session.server");
    const session = await verifiedSession(data);
    if (!session) return { ok: false as const };
    const { error } = await session.supabaseAdmin
      .from("demo_sessions")
      .update({ state: data.state, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: !error };
  });

export const interpretThesis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        belief: z.string().trim().min(10).max(2000),
        messages: z.array(messageSchema).max(30),
      })
      .parse(input),
  )
  .handler(async ({ data }) => demoProviders.ai.interpret(data.belief, data.messages));
export const clarifyThesis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        belief: z.string().trim().min(10).max(2000),
        answer: z.string().trim().max(1000).optional(),
        count: z.number().int().min(0).max(3),
      })
      .parse(input),
  )
  .handler(async ({ data }) => demoProviders.ai.clarify(data.belief, data.answer, data.count));
export const generateComposition = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ exposures: z.array(exposureSchema).min(1).max(8) }).parse(input),
  )
  .handler(async ({ data }) => demoProviders.assets.listForThesis(data.exposures));
export const askAboutComposition = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ question: z.string().trim().min(2).max(1000), state: stateSchema }).parse(input),
  )
  .handler(async ({ data }) => demoProviders.ai.answer(data.question, data.state));
