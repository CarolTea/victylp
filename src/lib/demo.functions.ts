import { createServerFn } from "@tanstack/react-start";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";
import { demoProviders } from "./demo/providers";

const credentialsSchema = z.object({ id: z.string().uuid(), secret: z.string().min(40).max(200) });
const messageSchema = z.object({ id: z.string().max(100), role: z.enum(["user", "assistant"]), text: z.string().max(3000), options: z.array(z.string().max(100)).max(8).optional() });
const exposureSchema = z.object({ id: z.string().max(80), name: z.string().max(100), description: z.string().max(300) });
const assetSchema = z.object({ id: z.string().max(80), ticker: z.string().max(20), name: z.string().max(120), allocation: z.number().min(0).max(100), exposure: z.string().max(200), why: z.string().max(300), risks: z.string().max(300), availability: z.string().max(100), category: z.string().max(100), price: z.number().nonnegative(), active: z.boolean() });
const investmentSchema = z.object({ id: z.string().max(100), assetId: z.string().max(80), ticker: z.string().max(20), amount: z.number().nonnegative().max(1_000_000), provider: z.string().max(80), route: z.string().max(120), status: z.literal("simulated"), createdAt: z.string().datetime() });
const stateSchema = z.object({
  step: z.enum(["input", "conversation", "interpretation", "composition"]), belief: z.string().max(2000), messages: z.array(messageSchema).max(30), clarificationCount: z.number().int().min(0).max(3), interpretation: z.string().max(4000), exposures: z.array(exposureSchema).max(8), assets: z.array(assetSchema).max(12), walletConnected: z.boolean(), investments: z.array(investmentSchema).max(30),
});

const hashSecret = (secret: string) => createHash("sha256").update(secret).digest("hex");
const secretsMatch = (provided: string, stored: string) => {
  const a = Buffer.from(hashSecret(provided), "hex");
  const b = Buffer.from(stored, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
};

async function verifiedSession(credentials: z.infer<typeof credentialsSchema>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("demo_sessions").select("id, secret_hash, state").eq("id", credentials.id).maybeSingle();
  if (error || !data || !secretsMatch(credentials.secret, data.secret_hash)) return null;
  const parsed = stateSchema.safeParse(data.state);
  return parsed.success ? { supabaseAdmin, state: parsed.data } : null;
}

export const createDemoSession = createServerFn({ method: "POST" }).handler(async () => {
  const secret = randomBytes(32).toString("base64url");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("demo_sessions").insert({ secret_hash: hashSecret(secret), state: { step: "input", belief: "", messages: [], clarificationCount: 0, interpretation: "", exposures: [], assets: [], walletConnected: false, investments: [] } }).select("id").single();
  if (error || !data) throw new Error("Demo session unavailable");
  return { id: data.id, secret };
});

export const loadDemoSession = createServerFn({ method: "POST" }).inputValidator((input: unknown) => credentialsSchema.parse(input)).handler(async ({ data }) => {
  const session = await verifiedSession(data);
  return session ? { ok: true as const, state: session.state } : { ok: false as const };
});

export const saveDemoSession = createServerFn({ method: "POST" }).inputValidator((input: unknown) => z.object({ ...credentialsSchema.shape, state: stateSchema }).parse(input)).handler(async ({ data }) => {
  const session = await verifiedSession(data);
  if (!session) return { ok: false as const };
  const { error } = await session.supabaseAdmin.from("demo_sessions").update({ state: data.state, updated_at: new Date().toISOString() }).eq("id", data.id);
  return { ok: !error };
});

export const interpretThesis = createServerFn({ method: "POST" }).inputValidator((input: unknown) => z.object({ belief: z.string().trim().min(10).max(2000), messages: z.array(messageSchema).max(30) }).parse(input)).handler(async ({ data }) => demoProviders.ai.interpret(data.belief, data.messages));
export const clarifyThesis = createServerFn({ method: "POST" }).inputValidator((input: unknown) => z.object({ belief: z.string().trim().min(10).max(2000), answer: z.string().trim().max(1000).optional(), count: z.number().int().min(0).max(3) }).parse(input)).handler(async ({ data }) => demoProviders.ai.clarify(data.belief, data.answer, data.count));
export const generateComposition = createServerFn({ method: "POST" }).inputValidator((input: unknown) => z.object({ exposures: z.array(exposureSchema).min(1).max(8) }).parse(input)).handler(async ({ data }) => demoProviders.assets.listForThesis(data.exposures));
export const askAboutComposition = createServerFn({ method: "POST" }).inputValidator((input: unknown) => z.object({ question: z.string().trim().min(2).max(1000), state: stateSchema }).parse(input)).handler(async ({ data }) => demoProviders.ai.answer(data.question, data.state));
export const simulateInvestment = createServerFn({ method: "POST" }).inputValidator((input: unknown) => z.object({ asset: assetSchema, amount: z.number().positive().max(1_000_000), walletConnected: z.boolean() }).parse(input)).handler(async ({ data }) => demoProviders.execution.simulate(data.asset, data.amount, data.walletConnected));
