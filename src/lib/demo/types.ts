export type DemoStep = "input" | "conversation" | "interpretation" | "composition";

export type DemoMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  options?: string[] | undefined;
};

export type Exposure = {
  id: string;
  name: string;
  description: string;
};

export type DemoAsset = {
  id: string;
  ticker: string;
  name: string;
  allocation: number;
  exposure: string;
  why: string;
  risks: string;
  availability: string;
  category: string;
  price: number;
  active: boolean;
};

export type SimulatedInvestment = {
  id: string;
  assetId: string;
  ticker: string;
  amount: number;
  provider: string;
  route: string;
  status: "simulated";
  createdAt: string;
};

export type DemoState = {
  step: DemoStep;
  belief: string;
  messages: DemoMessage[];
  clarificationCount: number;
  interpretation: string;
  exposures: Exposure[];
  assets: DemoAsset[];
  walletConnected: boolean;
  investments: SimulatedInvestment[];
};

export type DemoSessionCredentials = { id: string; secret: string };

export const emptyDemoState: DemoState = {
  step: "input",
  belief: "",
  messages: [],
  clarificationCount: 0,
  interpretation: "",
  exposures: [],
  assets: [],
  walletConnected: false,
  investments: [],
};
