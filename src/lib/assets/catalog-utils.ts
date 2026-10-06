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
  brazil: "brazil-equities",
  brazilian: "brazil-equities",
  "brazilian-economy": "brazil-equities",
  "brazilian-equities": "brazil-equities",
  "brazilian-stocks": "brazil-equities",
  "brazil-growth": "brazil-equities",
  "brazilian-consumer": "brazil-domestic-consumption",
  "brazilian-domestic-consumption": "brazil-domestic-consumption",
  "brazilian-energy": "brazil-energy",
  petrobras: "brazil-energy",
  "oil-exports": "commodity-exporters",
  "commodity-exports": "commodity-exporters",
  "brazil-commodity-exports": "commodity-exporters",
  "brazil-oil-exports": "brazil-energy",
  brl: "brl-liquidity",
  "brazilian-interest-rates": "brazil-interest-rates",
  selic: "brazil-interest-rates",
  "brazilian-fixed-income": "brazil-local-fixed-income",
  "brazil-fixed-income": "brazil-local-fixed-income",
  "brazilian-local-fixed-income": "brazil-local-fixed-income",
  "brazilian-government-bonds": "brazil-sovereign-debt",
  "brazil-sovereign-debt": "brazil-sovereign-debt",
  "brazilian-small-caps": "brazil-small-caps",
  mexico: "mexico-economy",
  "mexican-economy": "mexico-economy",
  "mexican-interest-rates": "mexico-interest-rates",
  "mexican-government-bonds": "mexico-sovereign-debt",
  "mexican-fixed-income": "mexico-local-fixed-income",
  cetes: "mexico-sovereign-debt",
  mxn: "mxn-liquidity",
  "latin-america": "latam",
  "latin-american-ecommerce": "latam-ecommerce",
  "latin-american-fintech": "latam-fintech",
  "emerging-markets": "emerging-market-equities",
};
// Only these regional infrastructure exposures may use thematic proxies.
// No automatic stripping of country prefixes: it would turn local bonds into US bonds.
const regionalProxies: Record<string, readonly string[]> = {
  "brazil-ai": ["ai"],
  "brazil-ai-infrastructure": ["ai", "compute"],
  "brazil-data-centers": ["data-centers"],
  "brazil-data-center-infrastructure": ["data-centers"],
  "brazil-data-center-power": ["data-center-power"],
};
const regionalGaps = [
  "brazil-small-caps",
  "latam-ecommerce",
  "latam-fintech",
  "emerging-market-consumption",
  "mexico-equities",
  "mxn-liquidity",
  "latam",
  "brazil-domestic-consumption",
];
function normalizedId(id: string) {
  return id.trim().toLowerCase().replace(/\s+/g, "-");
}
function canonicalId(id: string) {
  const normalized = normalizedId(id);
  return aliases[normalized] ?? normalized;
}
export const CATALOG_TAGS = [
  ...new Set([
    ...ASSET_CATALOG.flatMap((a) => [...a.themes, ...a.exposures]),
    ...Object.values(aliases),
    ...Object.keys(regionalProxies),
    ...regionalGaps,
  ]),
].sort();
export function exposureTags(exposure: Pick<Exposure, "id">) {
  const id = normalizedId(exposure.id);
  return new Set([id, aliases[id] ?? id]);
}
export function matchesExposure(asset: CatalogAsset, exposure: Pick<Exposure, "id">) {
  const id = canonicalId(exposure.id);
  const proxy = regionalProxies[id];
  if (proxy) return proxy.some((tag) => [...asset.exposures, ...asset.themes].includes(tag));
  if (id === "brazil-domestic-consumption") return asset.id === "backpack-ewz";
  // Geography alone is not an economic exposure. Regional matches use explicit
  // exposure IDs, never broad country themes shared by equities, bonds and cash.
  if (/^(brazil|brl|mexico|mxn|latam|emerging-market)/.test(id))
    return asset.exposures.includes(id);
  const tags = exposureTags(exposure);
  return [...asset.exposures, ...asset.themes].some((tag) => tags.has(tag));
}
export function getCandidateAssets(exposures: Exposure[], types?: InstrumentType[]) {
  const ids = exposures.map((e) => canonicalId(e.id));
  const ranked = ASSET_CATALOG.filter(
    (a) => a.enabled && (!types || types.includes(a.instrumentType)),
  )
    .map((asset) => ({
      asset,
      score: exposures.reduce(
        (n, e) =>
          n +
          (matchesExposure(asset, e)
            ? (e.importance === "secondary" ? 1 : 3) +
              (asset.id === "backpack-ewz" && canonicalId(e.id) === "brazil-equities" ? 1 : 0)
            : 0),
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
  for (const e of exposures) {
    if (regionalProxies[canonicalId(e.id)] && assets.some((a) => matchesExposure(a, e)))
      limitations.push(
        `The catalog has no direct Brazilian representation for ${e.name}. The candidates are thematic infrastructure proxies, not dedicated Brazilian exposure.`,
      );
  }
  if (ids.includes("brazil-domestic-consumption") && assets.some((a) => a.id === "backpack-ewz"))
    limitations.push(
      "EWZ offers broad Brazilian large- and mid-cap equities, not a dedicated domestic-consumption or small-cap portfolio.",
    );
  if (assets.some((a) => a.id === "ondo-pbr"))
    limitations.push(
      "PBRon represents Petrobras, a single oil-and-gas company, not broad Brazilian-market exposure or all commodity exporters.",
    );
  if (ids.includes("emerging-market-equities") || ids.includes("latam"))
    limitations.push(
      "The catalog has limited regional coverage, not a diversified Latin America or emerging-markets portfolio.",
    );
  if (assets.some((a) => a.id === "transfero-brz"))
    limitations.push(
      "BRZ represents BRL liquidity, not Brazilian corporate growth or yield-bearing fixed income.",
    );
  if (assets.some((a) => a.id === "etherfuse-tesouro" || a.id === "etherfuse-cetes"))
    limitations.push(
      "TESOURO and CETES represent local sovereign fixed income, not equities. Their returns, maturity, liquidity and eligibility are not asserted by this demo.",
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
    region,
    countryExposure,
    currencyExposure,
    marketExposure,
    availabilityScope,
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
    region,
    countryExposure,
    currencyExposure,
    marketExposure,
    availabilityScope,
  };
}
