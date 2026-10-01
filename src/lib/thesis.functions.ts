import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { performanceProvider } from "./thesis/performance";
import type { SavedAsset, SavedThesis } from "./thesis/types";

const credentialsSchema = z.object({ id: z.string().uuid(), secret: z.string().min(40).max(200) });
const assetSchema = z.object({ id: z.string().max(80), ticker: z.string().max(20), name: z.string().max(120), allocation: z.number().min(0).max(100), exposure: z.string().max(200), why: z.string().max(300), risks: z.string().max(300), availability: z.string().max(100), category: z.string().max(100), price: z.number().nonnegative(), active: z.boolean() });
const saveSchema = z.object({ credentials: credentialsSchema, name: z.string().trim().max(100).optional(), belief: z.string().trim().min(10).max(2000), interpretation: z.string().trim().min(10).max(4000), assets: z.array(assetSchema).min(1).max(12) });

function percent(current: number, initial: number) { return initial > 0 ? ((current - initial) / initial) * 100 : 0; }

export const saveTrackedThesis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { createHash, timingSafeEqual } = await import("crypto");
    const hash = createHash("sha256").update(data.credentials.secret).digest("hex");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: session } = await supabaseAdmin.from("demo_sessions").select("secret_hash").eq("id", data.credentials.id).maybeSingle();
    if (!session) throw new Error("Demo session unavailable");
    const expected = Buffer.from(session.secret_hash, "hex"); const provided = Buffer.from(hash, "hex");
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) throw new Error("Demo session unavailable");

    const email = typeof context.claims.email === "string" ? context.claims.email.toLowerCase() : "";
    if (!email) throw new Error("Authenticated email unavailable");
    const cleanName = data.name?.trim().replace(/\s+/g, " ") ?? "";
    const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id, name").eq("id", context.userId).maybeSingle();
    let profileName = cleanName;
    if (!existingProfile) {
      const { data: lead } = await supabaseAdmin.from("early_access_signups").select("name").eq("email", email).maybeSingle();
      if (profileName.length < 2 && lead?.name) profileName = lead.name;
      if (profileName.length < 2 && typeof context.claims.user_metadata === "object" && context.claims.user_metadata && "name" in context.claims.user_metadata && typeof context.claims.user_metadata["name"] === "string") profileName = context.claims.user_metadata["name"];
      if (profileName.length < 2) profileName = email.split("@")[0]?.slice(0, 100) || "VicTy member";
      const { error } = await supabaseAdmin.from("profiles").insert({ id: context.userId, email, name: profileName });
      if (error) throw new Error("Profile could not be saved");
    } else if (cleanName.length >= 2 && existingProfile.name !== cleanName) await supabaseAdmin.from("profiles").update({ name: cleanName }).eq("id", context.userId);

    const { data: existing } = await supabaseAdmin.from("theses").select("id").eq("demo_session_id", data.credentials.id).eq("user_id", context.userId).maybeSingle();
    if (existing) return { thesisId: existing.id };
    const activeAssets = data.assets.filter((asset) => asset.active && asset.allocation > 0);
    const createdAt = new Date(); const initialAmount = 1000;
    const generated = performanceProvider.generate(data.credentials.id, activeAssets, initialAmount, createdAt);
    const currentValue = generated.snapshots.at(-1)?.value ?? initialAmount;
    const title = data.belief.toLowerCase().includes("ai") ? "AI Infrastructure" : `${activeAssets[0]?.exposure ?? "Investment"} thesis`;
    const { data: thesis, error: thesisError } = await supabaseAdmin.from("theses").insert({ user_id: context.userId, demo_session_id: data.credentials.id, title, original_belief: data.belief, interpreted_thesis: data.interpretation }).select("id").single();
    if (thesisError || !thesis) throw new Error("Thesis could not be saved");
    const { data: composition, error: compositionError } = await supabaseAdmin.from("compositions").insert({ thesis_id: thesis.id, user_id: context.userId, initial_amount: initialAmount, current_simulated_value: currentValue }).select("id").single();
    if (compositionError || !composition) throw new Error("Composition could not be saved");
    const assetRows = activeAssets.map((asset) => { const multiplier = generated.assetMultipliers[asset.id] ?? 1; const initialValue = initialAmount * asset.allocation / 100; return { composition_id: composition.id, user_id: context.userId, asset_id: asset.id, ticker: asset.ticker, name: asset.name, allocation_percent: asset.allocation, initial_simulated_price: asset.price, current_simulated_price: asset.price * multiplier, initial_value: initialValue, current_value: initialValue * multiplier, category: asset.category, exposure: asset.exposure, why: asset.why, risks: asset.risks }; });
    const { error: assetsError } = await supabaseAdmin.from("composition_assets").insert(assetRows);
    const { error: snapshotsError } = await supabaseAdmin.from("performance_snapshots").insert(generated.snapshots.map((snapshot) => ({ composition_id: composition.id, user_id: context.userId, value: snapshot.value, snapshot_date: snapshot.date })));
    if (assetsError || snapshotsError) throw new Error("Performance could not be saved");
    return { thesisId: thesis.id };
  });

type ThesisRow = { id: string; title: string; original_belief: string; interpreted_thesis: string; status: string; created_at: string; compositions: Array<{ id: string; initial_amount: number; current_simulated_value: number; composition_assets: Array<{ id: string; asset_id: string; ticker: string; name: string; allocation_percent: number; initial_simulated_price: number; current_simulated_price: number; initial_value: number; current_value: number; category: string; exposure: string; why: string; risks: string }>; performance_snapshots: Array<{ snapshot_date: string; value: number }> }> };

function mapThesis(row: ThesisRow): SavedThesis {
  const composition = row.compositions[0]; const initial = Number(composition?.initial_amount ?? 0); const current = Number(composition?.current_simulated_value ?? initial);
  const snapshots = (composition?.performance_snapshots ?? []).map((point) => ({ date: point.snapshot_date, value: Number(point.value) })).sort((a, b) => a.date.localeCompare(b.date));
  const previous = snapshots.at(-2)?.value ?? initial;
  const assets: SavedAsset[] = (composition?.composition_assets ?? []).map((asset) => ({ id: asset.id, ticker: asset.ticker, name: asset.name, allocation: Number(asset.allocation_percent), initialPrice: Number(asset.initial_simulated_price), currentPrice: Number(asset.current_simulated_price), initialValue: Number(asset.initial_value), currentValue: Number(asset.current_value), category: asset.category, exposure: asset.exposure, why: asset.why, risks: asset.risks }));
  return { id: row.id, title: row.title, belief: row.original_belief, interpretation: row.interpreted_thesis, status: "demo", createdAt: row.created_at, initialAmount: initial, currentValue: current, performancePercent: percent(current, initial), todayPercent: percent(current, previous), assets, snapshots };
}

const selection = "id, title, original_belief, interpreted_thesis, status, created_at, compositions(id, initial_amount, current_simulated_value, composition_assets(id, asset_id, ticker, name, allocation_percent, initial_simulated_price, current_simulated_price, initial_value, current_value, category, exposure, why, risks), performance_snapshots(snapshot_date, value))";

export const listMyTheses = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("theses").select(selection).eq("user_id", context.userId).order("created_at", { ascending: false });
  if (error) throw new Error("Theses could not be loaded");
  return ((data ?? []) as unknown as ThesisRow[]).map(mapThesis);
});

export const getMyThesis = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { data: row, error } = await context.supabase.from("theses").select(selection).eq("id", data.id).eq("user_id", context.userId).maybeSingle();
  if (error || !row) return null;
  return mapThesis(row as unknown as ThesisRow);
});