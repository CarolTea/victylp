import { ASSET_CATALOG } from "./catalog";
import type { CatalogAsset, InstrumentType } from "./types";
import type { Exposure } from "../demo/types";

const aliases: Record<string, string> = {
  "artificial-intelligence": "ai",
  "compute-infrastructure": "compute",
  "digital-infrastructure": "blockchain",
  "rwa-infrastructure": "tokenization",
  "real-world-assets": "rwa",
  "energy-demand": "energy",
  "electricity-demand": "electricity",
  "semiconductor-demand": "semiconductors",
  "gold-price": "gold",
  "digital-payments": "payments",
  "solana-ecosystem": "solana",
  "broad-us-equity": "us-equity",
};
export const CATALOG_TAGS = [
  ...new Set(ASSET_CATALOG.flatMap((a) => [...a.themes, ...a.exposures])),
].sort();
export function exposureTags(exposure: Pick<Exposure, "id">) {
  const id = exposure.id.toLowerCase();
  return new Set([id, aliases[id] ?? id]);
}
export function matchesExposure(asset: CatalogAsset, exposure: Pick<Exposure, "id">) {
  const tags = exposureTags(exposure);
  return [...asset.exposures, ...asset.themes].some((tag) => tags.has(tag));
}
export function getCandidateAssets(exposures: Exposure[], types?: InstrumentType[]) {
  const ranked = ASSET_CATALOG.filter(
    (a) => a.enabled && (!types || types.includes(a.instrumentType)),
  )
    .map((asset) => ({
      asset,
      score: exposures.reduce(
        (n, e) => n + (matchesExposure(asset, e) ? (e.importance === "secondary" ? 1 : 3) : 0),
        0,
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.asset.id.localeCompare(b.asset.id));
  // Guarantee at least one representative per exposure before filling by score.
  const chosen = new Map<string, CatalogAsset>();
  for (const exposure of exposures) {
    const match = ranked.find((x) => matchesExposure(x.asset, exposure));
    if (match) chosen.set(match.asset.id, match.asset);
  }
  for (const { asset } of ranked) {
    if (chosen.size >= 15) break;
    chosen.set(asset.id, asset);
  }
  const assets = [...chosen.values()];
  const missing = exposures.filter((e) => !assets.some((a) => matchesExposure(a, e)));
  const limitations = missing.map(
    (e) => `The catalog has no approved representation for ${e.name}.`,
  );
  if (assets.length < 8)
    limitations.push(
      `Only ${assets.length} relevant catalog instruments were found; unrelated assets will not be added to fill the portfolio.`,
    );
  return { assets, limitations, missingPrimary: missing.some((e) => e.importance !== "secondary") };
}
export function getCatalogAsset(id: string) {
  return ASSET_CATALOG.find((a) => a.id === id && a.enabled);
}
export function modelAsset(asset: CatalogAsset) {
  const {
    id,
    ticker,
    displayTicker,
    name,
    instrumentType,
    provider,
    chain,
    themes,
    exposures,
    riskTags,
    description,
  } = asset;
  return {
    id,
    ticker,
    displayTicker,
    name,
    instrumentType,
    provider,
    chain,
    themes,
    exposures,
    riskTags,
    description,
  };
}
