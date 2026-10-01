import type { DemoAsset, DemoMessage, DemoState, Exposure, SimulatedInvestment } from "./types";

export interface AIProvider {
  clarify(belief: string, answer?: string, count?: number): Promise<{ messages: DemoMessage[]; ready: boolean }>;
  interpret(belief: string, messages: DemoMessage[]): Promise<{ interpretation: string; exposures: Exposure[] }>;
  answer(question: string, state: DemoState): Promise<string>;
}

export interface WalletProvider {
  getDemoWallet(connected: boolean): Promise<{ connected: boolean; address?: string; network?: string }>;
}

export interface AssetCatalogProvider { listForThesis(exposures: Exposure[]): Promise<DemoAsset[]>; }
export interface PriceProvider { plannedUsd(asset: DemoAsset, portfolioValue: number): number; }
export interface ExecutionProvider { simulate(asset: DemoAsset, amount: number, walletConnected: boolean): Promise<SimulatedInvestment>; }

const makeMessage = (role: DemoMessage["role"], text: string, options?: string[]): DemoMessage => ({
  id: crypto.randomUUID(), role, text, options,
});

export class MockAIProvider implements AIProvider {
  async clarify(belief: string, answer?: string, count = 0) {
    if (!answer) return { ready: false, messages: [makeMessage("user", belief), makeMessage("assistant", "Which part of that change are you most convinced about?", ["Compute", "Semiconductors", "Applications", "Digital infrastructure", "Broad AI exposure"])] };
    const followUp = count < 1
      ? makeMessage("assistant", "What matters most when representing this belief?", ["Growth potential", "Lower volatility", "Liquidity", "Balanced exposure"])
      : undefined;
    return { ready: !followUp, messages: [makeMessage("user", answer), ...(followUp ? [followUp] : [])] };
  }

  async interpret(belief: string, messages: DemoMessage[]) {
    const answers = messages.filter((message) => message.role === "user").slice(1).map((message) => message.text.toLowerCase()).join(" ");
    const emphasis = answers.includes("semiconductor") ? "with particular conviction in semiconductors" : answers.includes("liquidity") ? "while preserving meaningful liquidity" : "across the infrastructure that supports adoption";
    return {
      interpretation: `You believe continued growth in AI adoption will increase demand for compute infrastructure, semiconductors and the digital infrastructure supporting AI workloads, ${emphasis}.`,
      exposures: [
        { id: "semiconductors", name: "Semiconductors", description: "Accelerated computing hardware" },
        { id: "compute", name: "Compute infrastructure", description: "Capacity supporting AI workloads" },
        { id: "platforms", name: "AI platforms", description: "Software-led adoption" },
        { id: "digital", name: "Digital infrastructure", description: "Networks and settlement rails" },
        { id: "liquidity", name: "Liquidity", description: "Capital held for flexibility" },
      ],
    };
  }

  async answer(question: string, state: DemoState) {
    const q = question.toLowerCase();
    const total = state.assets.filter((asset) => asset.active).reduce((sum, asset) => sum + asset.allocation, 0);
    if (q.includes("nvda") || q.includes("35")) return "NVDA carries the largest proposed allocation because it is the most direct listed exposure to accelerated compute demand. That concentration also increases company-specific and valuation risk.";
    if (q.includes("remove") && q.includes("sol")) return `Removing SOL would reduce exposure to crypto-native infrastructure by 15 percentage points. Your total would become ${Math.max(0, total - (state.assets.find((asset) => asset.ticker === "SOL")?.allocation ?? 0))}%; VicTy would not redistribute the difference automatically.`;
    if (q.includes("less volatile")) return "A less volatile version could reduce NVDA, AMD and SOL, then hold more USDC. That may lower price sensitivity, but it also weakens direct participation in the thesis.";
    if (q.includes("rwa") || q.includes("tokenized")) return "A tokenized-only version is conceptually possible, but available instruments, custody structure, liquidity and tracking quality would need to be verified before execution.";
    return "This composition links each asset to a specific part of your thesis. You can change or reject any allocation; VicTy will keep the resulting difference visible rather than making decisions for you.";
  }
}

export class MockAssetCatalogProvider implements AssetCatalogProvider {
  async listForThesis() {
    return [
      { id: "nvda", ticker: "NVDA", name: "NVIDIA", allocation: 35, exposure: "Accelerated compute", why: "Direct exposure to AI compute demand", risks: "Valuation · concentration · semiconductor cycle", availability: "Demo route", category: "Equity", price: 172.4, active: true },
      { id: "amd", ticker: "AMD", name: "Advanced Micro Devices", allocation: 15, exposure: "Compute alternatives", why: "Diversifies semiconductor exposure", risks: "Competition · execution · cyclicality", availability: "Demo route", category: "Equity", price: 204.1, active: true },
      { id: "tnq", ticker: "tNASDAQ", name: "Tokenized Nasdaq exposure", allocation: 20, exposure: "AI platforms", why: "Broader technology participation", risks: "Tracking · issuer · market risk", availability: "Demo only", category: "Tokenized RWA", price: 100, active: true },
      { id: "sol", ticker: "SOL", name: "Solana", allocation: 15, exposure: "Digital infrastructure", why: "Crypto-native execution infrastructure", risks: "Volatility · protocol · regulatory", availability: "Solana Devnet", category: "Digital asset", price: 158.2, active: true },
      { id: "usdc", ticker: "USDC", name: "USD Coin", allocation: 15, exposure: "Liquidity", why: "Preserves optionality for adjustments", risks: "Issuer · depeg · regulatory", availability: "Solana Devnet", category: "Stablecoin", price: 1, active: true },
    ];
  }
}

export class MockPriceProvider implements PriceProvider { plannedUsd(asset: DemoAsset, portfolioValue: number) { return Math.round(portfolioValue * asset.allocation / 100); } }
export class MockWalletProvider implements WalletProvider { async getDemoWallet(connected: boolean) { return connected ? { connected: true, address: "7Xp8...B49H", network: "Solana Devnet" } : { connected: false }; } }
export class MockExecutionProvider implements ExecutionProvider {
  async simulate(asset: DemoAsset, amount: number, walletConnected: boolean) {
    if (!walletConnected) throw new Error("wallet_required");
    return { id: crypto.randomUUID(), assetId: asset.id, ticker: asset.ticker, amount, provider: "Jupiter", route: `USDC → ${asset.ticker}`, status: "simulated", createdAt: new Date().toISOString() };
  }
}

export const demoProviders = {
  ai: new MockAIProvider(), wallet: new MockWalletProvider(), assets: new MockAssetCatalogProvider(), prices: new MockPriceProvider(), execution: new MockExecutionProvider(),
};
