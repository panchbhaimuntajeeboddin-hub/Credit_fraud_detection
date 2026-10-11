import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2,
  CreditCard, Gauge, ShieldAlert, TrendingUp, Zap,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Badge, Card, PageHeader, StatCard } from "@/components/ui-kit";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Sentinel" }] }),
  component: DashboardPage,
});

const days = Array.from({ length: 30 }, (_, i) => ({
  d: `D${i + 1}`,
  txn: 8200 + Math.round(Math.sin(i / 3) * 1100 + Math.random() * 900),
  fraud: 60 + Math.round(Math.cos(i / 4) * 30 + Math.random() * 25),
}));

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i) => ({
  m, fraud: 220 + Math.round(Math.sin(i)*60 + Math.random()*90),
}));

const hourly = Array.from({ length: 24 }, (_, h) => ({
  h: `${h}h`, v: 200 + Math.round(Math.sin(h / 3.5) * 160 + Math.random() * 120),
}));

const pieData = [
  { name: "Genuine", value: 98412, color: "#10B981" },
  { name: "Fraud", value: 1287, color: "#EF4444" },
];

const risk = [
  { b: "0.0–0.2", v: 6400, c: "#10B981" },
  { b: "0.2–0.4", v: 2120, c: "#22C55E" },
  { b: "0.4–0.6", v: 980, c: "#F59E0B" },
  { b: "0.6–0.8", v: 410, c: "#F97316" },
  { b: "0.8–1.0", v: 187, c: "#EF4444" },
];

const tooltipStyle = { background: "#FFFFFF", border: "1px solid rgba(17,24,39,0.10)", color: "#1A1D24", borderRadius: 10, fontSize: 12 };

function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["model-performance"],
    queryFn: async () => {
      const response = await fetch("/api/model-performance");
      if (!response.ok) {
        throw new Error("Failed to fetch model metrics");
      }
      return response.json() as Promise<{
        accuracy: number;
        precision: number;
        recall: number;
        f1_score: number;
        roc_auc: number;
        confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
      }>;
    },
  });

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Real-time fraud signal across your portfolio · last 24 hours"
        actions={
          <>
            <button className="rounded-lg btn-ghost px-3 py-2 text-sm">Last 24h</button>
            <button className="rounded-lg btn-primary px-3 py-2 text-sm">Export report</button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard index={0} label="Total transactions" value="2.41M" delta={12.4} icon={CreditCard} tone="primary" />
        <StatCard index={1} label="Fraudulent" value="3,829" delta={-8.1} icon={ShieldAlert} tone="danger" />
        <StatCard index={2} label="Genuine" value="2.40M" delta={11.9} icon={CheckCircle2} tone="success" />
        <StatCard index={3} label="Detection accuracy" value={data?.accuracy ? data.accuracy.toString() : "99.91"} suffix="%" delta={0.5} icon={Gauge} tone="violet" />
        <StatCard index={4} label="Today's requests" value="142,308" delta={4.2} icon={Zap} tone="primary" />
        <StatCard index={5} label="Avg. risk score" value="0.07" delta={-2.1} icon={Activity} tone="warning" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Daily transactions vs fraud" subtitle="Last 30 days"
              action={<Badge tone="primary">Live</Badge>}>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="dTxn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.55}/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="dFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.5}/>
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="txn" stroke="#3B82F6" strokeWidth={2} fill="url(#dTxn)" />
                <Area type="monotone" dataKey="fraud" stroke="#EF4444" strokeWidth={2} fill="url(#dFraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Fraud vs Genuine" subtitle="Last 24h volume share">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={92} paddingAngle={3} stroke="none">
                  {pieData.map((p) => <Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-success/10 py-2"><div className="text-xs text-muted-foreground">Genuine</div><div className="font-mono text-sm font-semibold text-success">98.71%</div></div>
            <div className="rounded-lg bg-destructive/10 py-2"><div className="text-xs text-muted-foreground">Fraud</div><div className="font-mono text-sm font-semibold text-destructive">1.29%</div></div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Monthly fraud cases" subtitle="2025 — YTD">
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={months}>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="fraud" radius={[6,6,0,0]} fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Hourly activity" subtitle="Transactions per hour">
          <div className="h-60">
            <ResponsiveContainer>
              <LineChart data={hourly}>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="h" tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Risk distribution" subtitle="Score buckets · last 7d">
          <div className="space-y-3">
            {risk.map((r) => (
              <div key={r.b}>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-mono">{r.b}</span><span>{r.v.toLocaleString()}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary/60">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${(r.v / 7000) * 100}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full rounded-full" style={{ background: r.c }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Detection trend" subtitle="True positive rate · last 6 months">
          <div className="h-60">
            <ResponsiveContainer>
              <AreaChart data={Array.from({length: 26}, (_, i) => ({ w: `W${i+1}`, v: 95 + Math.sin(i/2)*2 + Math.random()*1.4 }))}>
                <defs>
                  <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.5}/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="w" tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={false} interval={3} />
                <YAxis domain={[90, 100]} tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2.5} fill="url(#trend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Live activity feed">
          <div className="space-y-3">
            {[
              { i: ShieldAlert, c: "danger", t: "Fraud blocked", s: "Visa •• 2241 · $4,210 · IN" },
              { i: AlertTriangle, c: "warning", t: "High risk", s: "Merchant FastMart · risk 0.82" },
              { i: CheckCircle2, c: "success", t: "Auth approved", s: "Mastercard •• 7820 · $42" },
              { i: TrendingUp, c: "primary", t: "Anomaly cluster", s: "+38 events · device fingerprint" },
              { i: Activity, c: "violet", t: "Model retrained", s: "v3.2.1 deployed · 99.43%" },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-secondary/30 p-3">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  r.c==="danger"?"bg-destructive/15 text-destructive":r.c==="warning"?"bg-warning/15 text-warning":r.c==="success"?"bg-success/15 text-success":r.c==="violet"?"bg-violet-500/15 text-violet-300":"bg-primary/15 text-primary"
                }`}><r.i className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{r.t}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.s}</div>
                </div>
                <div className="ml-auto text-[10px] text-muted-foreground">{i+1}m</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
