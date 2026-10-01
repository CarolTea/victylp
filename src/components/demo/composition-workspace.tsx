import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronDown, CircleAlert, Minus, Plus, RotateCcw, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import type { DemoAsset, DemoMessage, DemoState, SimulatedInvestment } from "@/lib/demo/types";

const PORTFOLIO_VALUE = 1000;

function AssetCard({ asset, onChange, onToggle, onInvest }: { asset: DemoAsset; onChange: (value: number) => void; onToggle: () => void; onInvest: () => void }) {
  const [details, setDetails] = useState(false);
  return <article className={`demo-asset-card ${asset.active ? "" : "is-rejected"}`}>
    <div className="demo-asset-top"><div className="demo-ticker"><span>{asset.ticker.slice(0, 2)}</span><div><strong>{asset.ticker}</strong><small>{asset.name}</small></div></div><span className="demo-category">{asset.category}</span></div>
    <div className="demo-allocation"><span>Proposed allocation</span><strong>{asset.allocation}%</strong><small>${Math.round(PORTFOLIO_VALUE * asset.allocation / 100)}</small></div>
    <div className="demo-exposure"><span>WHAT IT REPRESENTS</span><p>{asset.exposure}</p></div>
    <button type="button" className="demo-details-toggle" onClick={() => setDetails((value) => !value)} aria-expanded={details}>View details <ChevronDown className={details ? "rotate-180" : ""} /></button>
    {details && <div className="demo-details"><div><span>WHY IT'S HERE</span><p>{asset.why}</p></div><div><span>KNOWN RISKS</span><p>{asset.risks}</p></div><div><span>AVAILABILITY</span><p>{asset.availability}</p></div></div>}
    <div className="demo-asset-actions">{asset.active ? <><div className="demo-stepper"><Button variant="icon" size="icon-sm" aria-label={`Decrease ${asset.ticker}`} onClick={() => onChange(Math.max(0, asset.allocation - 5))}><Minus /></Button><label><span className="sr-only">Edit {asset.ticker} percentage</span><input type="number" min="0" max="100" value={asset.allocation} onChange={(event) => onChange(Math.min(100, Math.max(0, Number(event.target.value))))} />%</label><Button variant="icon" size="icon-sm" aria-label={`Increase ${asset.ticker}`} onClick={() => onChange(Math.min(100, asset.allocation + 5))}><Plus /></Button></div><Button variant="ghost" size="sm" onClick={onToggle}><X /> Reject</Button><Button size="sm" onClick={onInvest}>Invest</Button></> : <Button variant="outline" size="sm" onClick={onToggle}><RotateCcw /> Undo</Button>}</div>
  </article>;
}

export function CompositionWorkspace({ state, onState, onAsk, onSimulate, onTrack }: { state: DemoState; onState: (state: DemoState) => void; onAsk: (question: string) => Promise<string>; onSimulate: (asset: DemoAsset, amount: number) => Promise<SimulatedInvestment>; onTrack: () => void }) {
  const [selected, setSelected] = useState<DemoAsset | null>(null);
  const [reviewStep, setReviewStep] = useState<"review" | "approval" | "success">("review");
  const [askMessages, setAskMessages] = useState<DemoMessage[]>([]);
  const [asking, setAsking] = useState(false);
  const total = useMemo(() => state.assets.filter((asset) => asset.active).reduce((sum, asset) => sum + asset.allocation, 0), [state.assets]);
  const amount = selected ? Math.round(PORTFOLIO_VALUE * selected.allocation / 100) : 0;
  const updateAsset = (id: string, changes: Partial<DemoAsset>) => onState({ ...state, assets: state.assets.map((asset) => asset.id === id ? { ...asset, ...changes } : asset) });
  const ask = async (question: string) => {
    const clean = question.trim(); if (!clean || asking) return;
    setAskMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: clean }]); setAsking(true);
    try { const text = await onAsk(clean); setAskMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text }]); } finally { setAsking(false); }
  };
  const invest = async () => {
    if (!selected) return;
    if (!state.walletConnected) { onState({ ...state, walletConnected: true }); setReviewStep("approval"); return; }
    if (reviewStep === "review") { setReviewStep("approval"); return; }
    const result = await onSimulate(selected, amount); onState({ ...state, investments: [...state.investments, result] }); setReviewStep("success");
  };
  const close = () => { setSelected(null); setReviewStep("review"); };
  return <>
    <div className="demo-workspace">
      <div className="demo-workspace-main"><div className="demo-section-heading"><p className="eyebrow">THESIS → COMPOSITION</p><h1>How this thesis<br />can be represented</h1><p>This is a proposed composition for exploration. Nothing has been bought.</p></div>
        <div className="demo-asset-grid">{state.assets.map((asset) => <AssetCard key={asset.id} asset={asset} onChange={(allocation) => updateAsset(asset.id, { allocation })} onToggle={() => updateAsset(asset.id, { active: !asset.active })} onInvest={() => { setSelected(asset); setReviewStep("review"); }} />)}</div>
        <section className="demo-ask"><p className="eyebrow">ASK VICTY</p><h2>Ask VicTy about this composition</h2><div className="demo-suggestions">{["Why is NVDA 35%?", "What happens if I remove SOL?", "Make this less volatile.", "Can this thesis be represented only with tokenized RWAs?"].map((q) => <Button key={q} variant="outline" size="sm" onClick={() => void ask(q)}>{q}</Button>)}</div>{askMessages.length > 0 && <div className="demo-ask-messages">{askMessages.map((message) => <Message key={message.id} from={message.role}><MessageContent>{message.role === "assistant" ? <MessageResponse>{message.text}</MessageResponse> : message.text}</MessageContent></Message>)}{asking && <Shimmer className="text-muted-foreground">Reviewing composition...</Shimmer>}</div>}<PromptInput onSubmit={({ text }) => ask(text)}><PromptInputTextarea maxLength={1000} placeholder="Ask about an allocation, risk or alternative…" /><PromptInputFooter className="justify-end"><PromptInputSubmit status={asking ? "submitted" : "ready"} disabled={asking} /></PromptInputFooter></PromptInput></section>
      </div>
      <aside className="demo-summary"><div><span className="mono-label">COMPOSITION TOTAL</span><strong className={total === 100 ? "" : "is-warning"}>{total}%</strong><div className="demo-total-track"><span style={{ width: `${Math.min(total, 100)}%` }} /></div>{total === 100 ? <p className="demo-total-ok"><Check /> Fully allocated</p> : <p className="demo-total-warning"><CircleAlert /> {total < 100 ? `${100 - total}% unallocated` : `${total - 100}% overallocated`}</p>}</div><div className="demo-summary-list">{state.assets.filter((asset) => asset.active).map((asset) => <div key={asset.id}><span>{asset.ticker}</span><b>{asset.allocation}%</b></div>)}</div><div className="demo-wallet"><div className="demo-wallet-head"><Wallet /><div><strong>{state.walletConnected ? "Wallet connected" : "Demo wallet"}</strong><span>{state.walletConnected ? "7Xp8...B49H · Solana Devnet" : "No wallet connected"}</span></div></div><Button variant={state.walletConnected ? "outline" : "default"} size="sm" onClick={() => onState({ ...state, walletConnected: !state.walletConnected })}>{state.walletConnected ? "Disconnect" : "Connect wallet"}</Button></div><p className="demo-disclaimer">Demo only. No real asset purchase will occur.</p></aside>
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) close(); }}><DialogContent className="demo-review-dialog">{selected && <>{reviewStep === "success" ? <div className="demo-invest-success"><span><Check /></span><p className="eyebrow">SIMULATION COMPLETE</p><DialogTitle>Investment simulated</DialogTitle><DialogDescription>No real trade occurred. This result is for product exploration only.</DialogDescription><div className="demo-review-grid"><div><small>ASSET</small><strong>{selected.ticker}</strong></div><div><small>ALLOCATION</small><strong>${amount}</strong></div><div><small>EXECUTION PROVIDER</small><strong>Jupiter</strong></div><div><small>WALLET STATUS</small><strong>Connected · Devnet</strong></div></div><div className="demo-track-message"><strong>Your thesis is now being tracked.</strong><p>See how this composition evolves over time.</p></div><Button onClick={onTrack}>View my thesis <ArrowRight /></Button><Button variant="ghost" onClick={close}>Return to composition</Button></div> : <><DialogHeader><p className="eyebrow">{reviewStep === "review" ? "REVIEW ROUTE" : "WALLET APPROVAL"}</p><DialogTitle>{selected.ticker}</DialogTitle><DialogDescription>{reviewStep === "review" ? "Review how this proposed allocation would be routed." : "Simulate approval from your connected demo wallet."}</DialogDescription></DialogHeader><div className="demo-review-grid"><div><small>PLANNED ALLOCATION</small><strong>${amount}</strong></div><div><small>EXECUTION PROVIDER</small><strong>Jupiter</strong></div><div><small>ROUTE</small><strong>USDC → {selected.ticker}</strong></div><div><small>ESTIMATED EXECUTION</small><strong>${amount}</strong></div></div><div className="demo-route-warning">Demo route — no real asset purchase will occur.</div><DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => void invest()}>{reviewStep === "review" ? (state.walletConnected ? "Review transaction" : "Connect demo wallet") : "Approve simulation"}</Button></DialogFooter></>}</>}</DialogContent></Dialog>
  </>;
}
