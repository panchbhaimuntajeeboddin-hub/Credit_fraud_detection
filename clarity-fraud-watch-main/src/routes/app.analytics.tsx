import { createFileRoute } from "@tanstack/react-router";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, RadialBar, RadialBarChart,
} from "recharts";
import { Card, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Sentinel" }] }),
  component: AnalyticsPage,
});

const tip = { background: "#FFFFFF", border: "1px solid rgba(17,24,39,0.10)", color: "#1A1D24", borderRadius: 10, fontSize: 12 };

const trend = Array.from({length: 30}, (_,i)=>({ d:`D${i+1}`, txn: 8000+Math.round(Math.sin(i/3)*1200+Math.random()*900), fraud: 60+Math.round(Math.cos(i/4)*30+Math.random()*25) }));
const merchants = [
  { m:"FastMart", v: 420 }, { m:"Steam", v: 312 }, { m:"Apple", v: 268 },
  { m:"Uber", v: 220 }, { m:"IKEA", v: 198 }, { m:"Zara", v: 176 }, { m:"Shell", v: 140 },
];
const buckets = [
  { b:"<$50", v: 180 }, { b:"$50–200", v: 420 }, { b:"$200–500", v: 380 },
  { b:"$500–1k", v: 240 }, { b:"$1k–5k", v: 162 }, { b:">$5k", v: 88 },
];
const pie = [
  { name: "Card present", value: 38, color: "#3B82F6" },
  { name: "Card not present", value: 47, color: "#8B5CF6" },
  { name: "Recurring", value: 9, color: "#10B981" },
  { name: "Wallet", value: 6, color: "#F59E0B" },
];
const radial = [
  { name: "TPR", value: 96.3, fill: "#10B981" },
  { name: "PPV", value: 92.1, fill: "#3B82F6" },
  { name: "AUC", value: 98.7, fill: "#8B5CF6" },
];
const locations = [
  { c:"Mumbai", p: 92 },{ c:"Delhi", p: 78 },{ c:"Bangalore", p: 71 },
  { c:"Hyderabad", p: 64 },{ c:"Chennai", p: 51 },{ c:"Pune", p: 43 },{ c:"Kolkata", p: 39 },
];

function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" description="Cross-cut fraud analysis across merchants, geographies, time and amount bands." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Fraud trend" subtitle="Daily fraud vs total volume">
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5}/><stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0.5}/><stop offset="100%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="d" tick={{fill:"#94A3B8",fontSize:11}} tickLine={false} axisLine={false} />
                <YAxis tick={{fill:"#94A3B8",fontSize:11}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tip} />
                <Area type="monotone" dataKey="txn" stroke="#3B82F6" strokeWidth={2} fill="url(#a1)" />
                <Area type="monotone" dataKey="fraud" stroke="#EF4444" strokeWidth={2} fill="url(#a2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Channel mix">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={50} outerRadius={92} paddingAngle={3} stroke="none">
                  {pie.map((p)=><Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Tooltip contentStyle={tip} />
                <Legend iconType="circle" wrapperStyle={{fontSize:11,color:"#94A3B8"}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Fraud by merchant" subtitle="Top offenders — last 30d">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={merchants} layout="vertical">
                <CartesianGrid stroke="rgba(148,163,184,0.08)" horizontal={false} />
                <XAxis type="number" tick={{fill:"#94A3B8",fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="m" tick={{fill:"#94A3B8",fontSize:11}} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={tip} />
                <Bar dataKey="v" radius={[0,6,6,0]} fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Fraud by amount bucket">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={buckets}>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="b" tick={{fill:"#94A3B8",fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:"#94A3B8",fontSize:11}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} />
                <Bar dataKey="v" radius={[6,6,0,0]} fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Top risk locations">
          <div className="space-y-3">
            {locations.map(l=>(
              <div key={l.c}>
                <div className="flex justify-between text-xs"><span>{l.c}</span><span className="font-mono text-muted-foreground">{l.p}</span></div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-warning to-destructive" style={{width:`${l.p}%`}} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Model quality" subtitle="Radial summary">
          <div className="h-60">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="35%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" background cornerRadius={8} />
                <Legend iconSize={8} wrapperStyle={{fontSize:11,color:"#94A3B8"}} />
                <Tooltip contentStyle={tip} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Hourly heatmap" subtitle="Fraud density · weekday × hour">
          <Heatmap />
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Monthly fraud analysis" subtitle="Detected vs missed (estimated)">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={Array.from({length:12},(_,i)=>({ m:["J","F","M","A","M","J","J","A","S","O","N","D"][i], detected: 240+Math.round(Math.sin(i)*60+Math.random()*40), missed: 20+Math.round(Math.cos(i)*8+Math.random()*8) }))}>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="m" tick={{fill:"#94A3B8",fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:"#94A3B8",fontSize:11}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} />
                <Legend wrapperStyle={{fontSize:11,color:"#94A3B8"}}/>
                <Line type="monotone" dataKey="detected" stroke="#10B981" strokeWidth={2.5} dot={false}/>
                <Line type="monotone" dataKey="missed" stroke="#EF4444" strokeWidth={2.5} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Heatmap() {
  const days = ["M","T","W","T","F","S","S"];
  const cells = Array.from({length: 7}, (_, d) => Array.from({length: 24}, (_, h) => {
    const v = Math.max(0, Math.sin((h-2)/4) * 0.6 + (d===5||d===6?0.3:0) + Math.random()*0.3);
    return Math.min(1, v);
  }));
  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="flex gap-1">
          <div className="w-6" />
          {Array.from({length:24}).map((_,h)=><div key={h} className="w-3.5 text-center text-[8px] text-muted-foreground">{h%6===0?h:""}</div>)}
        </div>
        {cells.map((row,d)=>(
          <div key={d} className="mt-1 flex items-center gap-1">
            <div className="w-6 text-[10px] text-muted-foreground">{days[d]}</div>
            {row.map((v,h)=>(
              <div key={h} className="h-3.5 w-3.5 rounded-sm" style={{
                background: `rgba(239,68,68,${0.08+v*0.85})`,
                boxShadow: v>0.7?"0 0 6px rgba(239,68,68,0.45)":undefined
              }} title={`Risk ${(v*100).toFixed(0)}%`} />
            ))}
          </div>
        ))}
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          Low <div className="h-2 w-32 rounded-full bg-gradient-to-r from-destructive/15 to-destructive" /> High
        </div>
      </div>
    </div>
  );
}
