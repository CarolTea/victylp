import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { VicTyLogo } from "@/components/victy-logo";
import { DemoChat } from "@/components/demo/demo-chat";
import { CompositionWorkspace } from "@/components/demo/composition-workspace";
import { askAboutComposition, clarifyThesis, createDemoSession, generateComposition, interpretThesis, loadDemoSession, saveDemoSession, simulateInvestment } from "@/lib/demo.functions";
import { emptyDemoState, type DemoSessionCredentials, type DemoState } from "@/lib/demo/types";

const STORAGE_KEY = "victy_demo_session_v1";
const examples = ["I believe AI infrastructure will keep growing.", "I believe tokenized real-world assets will become part of mainstream finance.", "I believe demand for energy will increase because of AI.", "I believe stablecoins will become global payment infrastructure."];

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [
    { title: "Interactive Product Demo — VicTy" },
    { name: "description", content: "Explore how VicTy translates a belief into an understandable investment thesis and proposed asset composition." },
    { property: "og:title", content: "Interactive Product Demo — VicTy" },
    { property: "og:description", content: "Turn a belief into a thesis, exposures and a composition you control." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }), component: DemoPage,
});

function DemoPage() {
  const createSession = useServerFn(createDemoSession); const loadSession = useServerFn(loadDemoSession); const saveSession = useServerFn(saveDemoSession); const clarify = useServerFn(clarifyThesis); const interpret = useServerFn(interpretThesis); const compose = useServerFn(generateComposition); const ask = useServerFn(askAboutComposition); const simulate = useServerFn(simulateInvestment);
  const [state, setState] = useState<DemoState>(emptyDemoState); const [credentials, setCredentials] = useState<DemoSessionCredentials | null>(null); const [ready, setReady] = useState(false); const [pending, setPending] = useState(false); const [error, setError] = useState(""); const [draft, setDraft] = useState("");
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [state.step]);
  useEffect(() => { void (async () => { try { const raw = window.localStorage.getItem(STORAGE_KEY); if (raw) { const saved = JSON.parse(raw) as DemoSessionCredentials; const result = await loadSession({ data: saved }); if (result.ok) { setCredentials(saved); setState(result.state); setReady(true); return; } } const created = await createSession(); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(created)); setCredentials(created); } catch { setError("The demo session could not be prepared. Please refresh and try again."); } finally { setReady(true); } })(); }, [createSession, loadSession]);
  const updateState = useCallback((next: DemoState) => { setState(next); if (credentials) void saveSession({ data: { ...credentials, state: next } }); }, [credentials, saveSession]);
  const begin = async (belief: string) => { const clean = belief.trim(); if (clean.length < 10) { setError("Describe your belief in a little more detail."); return; } setPending(true); setError(""); try { const result = await clarify({ data: { belief: clean, count: 0 } }); updateState({ ...state, step: "conversation", belief: clean, messages: result.messages, clarificationCount: 0 }); } catch { setError("VicTy could not start the demo. Please try again."); } finally { setPending(false); } };
  const reply = async (answer: string) => { setPending(true); const optimistic = [...state.messages, { id: crypto.randomUUID(), role: "user" as const, text: answer }]; updateState({ ...state, messages: optimistic }); try { const result = await clarify({ data: { belief: state.belief, answer, count: state.clarificationCount } }); const messages = [...optimistic, ...result.messages.filter((message) => message.role === "assistant")]; if (result.ready) { const understood = await interpret({ data: { belief: state.belief, messages } }); updateState({ ...state, step: "interpretation", messages, clarificationCount: state.clarificationCount + 1, ...understood }); } else updateState({ ...state, messages, clarificationCount: state.clarificationCount + 1 }); } catch { setError("The response could not be processed. Please try again."); } finally { setPending(false); } };
  const build = async () => { setPending(true); try { const assets = await compose({ data: { exposures: state.exposures } }); updateState({ ...state, step: "composition", assets }); } finally { setPending(false); } };
  const reset = () => updateState(emptyDemoState);
  if (!ready) return <main className="demo-page demo-loading"><VicTyLogo /><p>Preparing your demo…</p></main>;
  return <main className="demo-page"><header className="demo-header"><Link to="/" aria-label="Back to VicTy home"><VicTyLogo /></Link><div className="demo-progress" aria-label="Demo progress">{["Belief", "Refine", "Interpret", "Compose"].map((label, index) => <span key={label} className={(state.step === "input" ? 0 : state.step === "conversation" ? 1 : state.step === "interpretation" ? 2 : 3) >= index ? "is-active" : ""}><i>{index < (state.step === "input" ? 0 : state.step === "conversation" ? 1 : state.step === "interpretation" ? 2 : 3) ? <Check /> : index + 1}</i>{label}</span>)}</div><Button variant="ghost" size="sm" onClick={reset}><RotateCcw /> Start over</Button></header>
    {error && <div className="demo-error" role="alert">{error}</div>}
    {state.step === "input" && <section className="demo-intro"><div className="demo-intro-copy"><p className="eyebrow"><span className="signal-dot" /> INTERACTIVE PRODUCT DEMO</p><h1>What do you<br /><span className="gradient-text">believe in?</span></h1><p>Describe a belief about the future. VicTy will help translate it into an investment thesis you can understand and explore.</p></div><div className="demo-belief-entry"><label htmlFor="belief">YOUR BELIEF</label><textarea id="belief" autoFocus maxLength={2000} value={draft} onChange={(event) => { setDraft(event.currentTarget.value); setError(""); }} placeholder="I believe…" /><Button size="lg" disabled={pending || draft.trim().length < 10} onClick={() => void begin(draft)}>Explore this thesis <ArrowRight /></Button></div><div className="demo-examples"><span>OR START WITH AN EXAMPLE</span>{examples.map((example) => <button type="button" key={example} onClick={() => setDraft(example)}>{example}<ArrowRight /></button>)}</div></section>}
    {state.step === "conversation" && <section className="demo-flow"><div className="demo-flow-copy"><p className="eyebrow">REFINE THE THESIS</p><h1>A clearer belief<br />creates a clearer structure.</h1><p>VicTy asks only what is needed to understand the conviction behind your idea.</p></div><DemoChat messages={state.messages} pending={pending} onReply={reply} /></section>}
    {state.step === "interpretation" && <section className="demo-interpret"><div className="demo-interpret-main"><p className="eyebrow">THESIS INTERPRETATION</p><h1>Here’s how I understand<br /><span className="gradient-text">your thesis.</span></h1><blockquote>{state.interpretation}</blockquote><div className="demo-interpret-actions"><Button size="lg" onClick={() => void build()} disabled={pending}>{pending ? "Building…" : "Build a composition"}<ArrowRight /></Button><Button variant="outline" size="lg" onClick={() => updateState({ ...state, step: "conversation" })}><ArrowLeft /> Adjust thesis</Button></div></div><div className="demo-exposure-stack">{state.exposures.map((exposure, index) => <article key={exposure.id}><span>0{index + 1}</span><div><strong>{exposure.name}</strong><p>{exposure.description}</p></div></article>)}</div></section>}
    {state.step === "composition" && <CompositionWorkspace state={state} onState={updateState} onAsk={async (question) => ask({ data: { question, state } })} onSimulate={async (asset, amount) => simulate({ data: { asset, amount, walletConnected: state.walletConnected } })} />}
  </main>;
}
