import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck, Zap, Brain, Gauge, BellRing, BarChart3, Lock,
  ArrowRight, Check, ChevronDown, Sparkles, Activity, Layers, GitBranch,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel — AI Credit Card Fraud Detection" },
      { name: "description", content: "Real-time, ML-powered fraud detection for banks and fintech. Score and block fraudulent transactions in milliseconds." },
      { property: "og:title", content: "Sentinel — AI Credit Card Fraud Detection" },
      { property: "og:description", content: "Real-time ML fraud detection platform for banks and fintech." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <Faq />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "py-2" : "py-4"}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 sm:px-6 ${scrolled ? "glass-strong" : ""} mx-3 sm:mx-auto`}>
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#stats" className="hover:text-foreground">Performance</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:block">Log in</Link>
          <Link to="/register" className="rounded-lg btn-primary px-4 py-2 text-sm font-medium">Get started</Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section ref={ref} className="relative pt-36 pb-24 sm:pt-44 sm:pb-32">
      <div className="pointer-events-none absolute inset-0 ring-grid opacity-[0.35] [mask-image:radial-gradient(60%_50%_at_50%_30%,#000_30%,transparent_75%)]" />
      <motion.div style={{ y }} className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2">
        <div className="h-[520px] w-[820px] max-w-[95vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.35),transparent_60%)] blur-2xl" />
      </motion.div>

      <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>
          Real-time scoring · 99.41% accuracy · PCI-DSS aligned
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          <span className="gradient-text">AI-Powered</span><br />
          Credit Card Fraud Detection
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          Sentinel combines deep learning, graph signals and behavioural analytics to stop fraudulent card transactions in under <span className="text-foreground font-medium">40&nbsp;ms</span> — before they reach your network.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link to="/app/dashboard" className="inline-flex items-center gap-2 rounded-xl btn-primary px-5 py-3 text-sm font-semibold">
            Try Demo <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/app/dashboard" className="inline-flex items-center gap-2 rounded-xl btn-ghost px-5 py-3 text-sm font-semibold">
            View Dashboard
          </Link>
        </motion.div>

        <HeroPreview />
      </div>
    </section>
  );
}

const previewData = Array.from({ length: 24 }, (_, i) => ({
  t: i, txn: 800 + Math.round(Math.sin(i / 2) * 200 + Math.random() * 180 + i * 18),
  fraud: 8 + Math.round(Math.cos(i / 3) * 6 + Math.random() * 5),
}));

function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}
      className="relative mx-auto mt-14 max-w-5xl"
    >
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/20 via-violet-500/10 to-success/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-border glass-strong">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          </div>
          <div className="rounded-md bg-secondary/60 px-3 py-1 font-mono text-[11px] text-muted-foreground">sentinel.ai/dashboard</div>
          <div className="hidden text-[11px] text-muted-foreground sm:block">live · 2s ago</div>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-xl bg-background/40 p-4 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Transactions / hour</div>
                <div className="font-display text-2xl font-bold">12,847</div>
              </div>
              <div className="flex gap-1.5">
                {["1H","24H","7D"].map((t,i)=>(
                  <span key={t} className={`rounded-md px-2 py-1 text-[10px] ${i===1?"bg-primary/15 text-primary":"text-muted-foreground"}`}>{t}</span>
                ))}
              </div>
            </div>
            <div className="mt-3 h-44">
              <ResponsiveContainer>
                <AreaChart data={previewData}>
                  <defs>
                    <linearGradient id="gTxn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.7}/>
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gFraud" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="t" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background:"#FFFFFF", border:"1px solid rgba(17,24,39,0.10)", color:"#1A1D24", borderRadius:8, fontSize:12 }} />
                  <Area type="monotone" dataKey="txn" stroke="#3B82F6" strokeWidth={2} fill="url(#gTxn)" />
                  <Area type="monotone" dataKey="fraud" stroke="#EF4444" strokeWidth={2} fill="url(#gFraud)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-3">
            <MiniRow label="Live risk score" value="0.07" tone="success" />
            <MiniRow label="Blocked (1h)" value="143" tone="danger" />
            <MiniRow label="Model latency" value="38ms" tone="primary" />
            <div className="rounded-xl bg-background/40 p-3 ring-1 ring-border">
              <div className="mb-2 text-xs text-muted-foreground">Latest alerts</div>
              {[
                { t: "Fraud blocked · $4,210 · Visa **2241", c: "danger" },
                { t: "Risk spike · merchant FastMart", c: "warning" },
                { t: "Model v3.2 deployed", c: "primary" },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2 py-1 text-[11px]">
                  <span className={`h-1.5 w-1.5 rounded-full ${r.c==="danger"?"bg-destructive":r.c==="warning"?"bg-warning":"bg-primary"}`} />
                  <span className="truncate text-muted-foreground">{r.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MiniRow({ label, value, tone }: { label: string; value: string; tone: "success"|"danger"|"primary" }) {
  const c = tone==="success"?"text-success":tone==="danger"?"text-destructive":"text-primary";
  return (
    <div className="flex items-center justify-between rounded-xl bg-background/40 px-3 py-2.5 ring-1 ring-border">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm font-semibold ${c}`}>{value}</span>
    </div>
  );
}

function Logos() {
  const items = ["NORTHBANK", "PAYWAVE", "AXIS LABS", "MERIDIAN", "FINOVA", "VAULTLY"];
  return (
    <section className="border-y border-border bg-background/60 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
        <span className="text-[10px]">Trusted by risk teams at</span>
        {items.map((x) => <span key={x} className="font-display">{x}</span>)}
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Zap, title: "Real-time fraud detection", desc: "Sub-50ms scoring on every authorization with streaming feature pipelines.", tone: "primary" },
  { icon: Brain, title: "ML model ensemble", desc: "Gradient boosted trees, deep networks and graph neural nets — picked per merchant.", tone: "violet" },
  { icon: Gauge, title: "Risk score analysis", desc: "Per-transaction risk score with explainable feature contributions.", tone: "warning" },
  { icon: BellRing, title: "Instant alerts", desc: "Webhook, email, SMS and in-app alerts the moment risk crosses your threshold.", tone: "danger" },
  { icon: BarChart3, title: "Fraud analytics", desc: "Interactive cohort, merchant and geography analytics out of the box.", tone: "primary" },
  { icon: Lock, title: "Secure by design", desc: "SOC2, PCI-DSS aligned. End-to-end encryption and granular access control.", tone: "success" },
];

function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything risk teams need, in one place"
          subtitle="A modern toolkit to detect, investigate and prevent card fraud at scale."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl card-elevated p-6"
            >
              <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl transition-opacity duration-500 ${
                f.tone==="primary"?"bg-primary/25":f.tone==="violet"?"bg-violet-500/25":f.tone==="warning"?"bg-warning/25":f.tone==="danger"?"bg-destructive/25":"bg-success/25"
              } opacity-40 group-hover:opacity-80`} />
              <div className={`relative grid h-11 w-11 place-items-center rounded-xl ring-1 ring-white/10 ${
                f.tone==="primary"?"bg-primary/15 text-primary":f.tone==="violet"?"bg-violet-500/15 text-violet-300":f.tone==="warning"?"bg-warning/15 text-warning":f.tone==="danger"?"bg-destructive/15 text-destructive":"bg-success/15 text-success"
              }`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="relative mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="relative mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Layers, title: "Transaction", desc: "Authorization arrives from the issuer or gateway." },
  { icon: GitBranch, title: "Feature extraction", desc: "200+ behavioural, velocity and graph features computed in stream." },
  { icon: Brain, title: "ML model", desc: "Ensemble model scores the event against learned fraud patterns." },
  { icon: Gauge, title: "Fraud probability", desc: "Calibrated 0–1 probability with SHAP-style explanations." },
  { icon: ShieldCheck, title: "Prediction result", desc: "Approve, review or block — with full audit trail." },
];

function HowItWorks() {
  return (
    <section id="how" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From swipe to decision in 40 milliseconds"
          subtitle="A streaming ML pipeline that runs end-to-end on every transaction."
        />
        <div className="relative mt-14">
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent md:block" />
          <div className="space-y-6 md:space-y-10">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
                className={`relative grid items-center gap-4 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:col-start-2" : ""}`}
              >
                <div className={`rounded-2xl card-elevated p-5 ${i % 2 ? "md:ml-8" : "md:mr-8"}`}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Step {i + 1}</div>
                      <div className="font-display text-base font-semibold">{s.title}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{s.desc}</p>
                </div>
                <div className="hidden md:block" />
                <span className="absolute left-1/2 hidden h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-primary/20 md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section id="stats" className="relative py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Counter label="Transactions processed" value={482_193_204} suffix="+" />
          <Counter label="Fraud detected" value={1_284_716} />
          <Counter label="Detection accuracy" value={99.41} decimals={2} suffix="%" />
          <Counter label="Active users" value={12_480} suffix="+" />
        </div>
      </div>
    </section>
  );
}

function Counter({ label, value, suffix = "", decimals = 0 }: { label: string; value: number; suffix?: string; decimals?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const start = performance.now(); const dur = 1400;
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(value * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el); return () => io.disconnect();
  }, [value]);
  return (
    <div ref={ref} className="rounded-2xl card-elevated p-6 text-center">
      <div className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

const TESTIMONIALS = [
  { name: "Priya Menon", role: "Head of Risk, Northbank", quote: "Sentinel cut our fraud losses by 63% in the first quarter. The explainability alone is worth it." },
  { name: "Daniel Cruz", role: "VP Engineering, Paywave", quote: "We replaced a 4-vendor stack with Sentinel. Latency dropped from 220ms to 38ms." },
  { name: "Ayesha Khan", role: "Fraud Lead, Finova", quote: "The analyst experience is unreal — review queues, case timelines, audit logs. It just works." },
];

function Testimonials() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Loved by risk teams" title="Operators trust Sentinel" />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl card-elevated p-6"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">"{t.quote}"</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs font-bold">
                  {t.name.split(" ").map(x => x[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "How fast is Sentinel?", a: "Median end-to-end latency is under 40ms on standard hardware, including feature extraction and scoring." },
  { q: "Can I bring my own model?", a: "Yes — Sentinel supports custom ONNX/Sklearn models alongside the built-in ensemble." },
  { q: "Is it PCI compliant?", a: "Sentinel is built to PCI-DSS controls and is SOC 2 Type II audited." },
  { q: "Do you offer a free trial?", a: "Every plan starts with a 14-day trial including the full analytics suite." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="rounded-2xl card-elevated">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-medium">{f.q}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 text-sm text-muted-foreground">{f.a}</div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-violet-500/10 to-background p-10 text-center">
          <div className="pointer-events-none absolute inset-0 ring-grid opacity-30" />
          <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">Stop fraud before it happens.</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">Spin up a sandbox and score your first transaction in minutes.</p>
          <div className="relative mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl btn-primary px-5 py-3 text-sm font-semibold">
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/app/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl btn-ghost px-5 py-3 text-sm font-semibold">
              Explore the dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row">
        <Logo />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Security</a>
          <a href="#" className="hover:text-foreground">Status</a>
          <a href="#" className="hover:text-foreground">Docs</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Sentinel Labs</div>
      </div>
    </footer>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
    </div>
  );
}
