import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, AlertTriangle, Activity, Sparkles, Settings as Cog } from "lucide-react";
import { Card, PageHeader, Badge } from "@/components/ui-kit";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Sentinel" }] }),
  component: NotifPage,
});

const NOTIFS = [
  { icon: ShieldAlert, t: "Fraud alert", s: "Visa •• 2241 blocked · $4,210 · IN", tone: "danger", time: "2m" },
  { icon: AlertTriangle, t: "High risk transaction", s: "Merchant FastMart · risk 0.87", tone: "warning", time: "11m" },
  { icon: Sparkles, t: "Model updated", s: "v3.2.1 deployed · AUC 98.72", tone: "primary", time: "1h" },
  { icon: AlertTriangle, t: "System warning", s: "Webhook delivery latency > 800ms", tone: "warning", time: "3h" },
  { icon: Activity, t: "New prediction", s: "Batch upload of 12,400 events scored", tone: "violet", time: "5h" },
] as const;

function NotifPage() {
  return (
    <div>
      <PageHeader title="Notifications" description="Alerts, model events and system signals." actions={<button className="inline-flex items-center gap-1.5 rounded-lg btn-ghost px-3 py-2 text-sm"><Cog className="h-4 w-4" /> Preferences</button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Inbox">
          <ul className="divide-y divide-border">
            {NOTIFS.map((n,i)=>(
              <li key={i} className="flex items-start gap-3 py-4">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  n.tone==="danger"?"bg-destructive/15 text-destructive":n.tone==="warning"?"bg-warning/15 text-warning":n.tone==="violet"?"bg-violet-500/15 text-violet-300":"bg-primary/15 text-primary"
                }`}><n.icon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="text-sm font-semibold">{n.t}</span><Badge tone={n.tone === "violet" ? "primary" : (n.tone as "danger"|"warning"|"primary")}>{n.tone}</Badge></div>
                  <div className="text-xs text-muted-foreground">{n.s}</div>
                </div>
                <span className="text-[11px] text-muted-foreground">{n.time}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Preferences">
          {[
            { l:"Fraud alerts (real-time)", on:true },
            { l:"High-risk transaction summary", on:true },
            { l:"Model retraining events", on:true },
            { l:"System status warnings", on:false },
            { l:"Weekly digest email", on:true },
          ].map((p,i)=>(
            <label key={i} className="flex items-center justify-between border-b border-border py-3 last:border-0">
              <span className="text-sm">{p.l}</span>
              <input type="checkbox" defaultChecked={p.on} className="h-4 w-8 appearance-none rounded-full bg-secondary ring-1 ring-border transition-all checked:bg-primary relative cursor-pointer
                before:absolute before:left-0.5 before:top-0.5 before:h-3 before:w-3 before:rounded-full before:bg-foreground before:transition-transform checked:before:translate-x-4" />
            </label>
          ))}
        </Card>
      </div>
    </div>
  );
}
