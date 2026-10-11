import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Shield, Bell, Key, Palette, Save } from "lucide-react";
import { Card, PageHeader, Badge } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — Sentinel" }] }),
  component: SettingsPage,
});

const TABS = [
  { k: "profile", l: "Profile", icon: User },
  { k: "security", l: "Security", icon: Shield },
  { k: "password", l: "Password", icon: Key },
  { k: "theme", l: "Theme", icon: Palette },
  { k: "notifications", l: "Notifications", icon: Bell },
  { k: "api", l: "API", icon: Key },
] as const;

const inp = "h-10 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30";

function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<typeof TABS[number]["k"]>("profile");

  const firstName = user?.firstName || "Aarav";
  const lastName = user?.lastName || "Kapoor";
  const email = user?.email || "aarav@northbank.io";
  const company = user?.company || "Northbank";
  const role = user?.role || "Risk Analyst";
  const fullName = `${firstName} ${lastName}`;
  const initials = `${firstName.charAt(0) || ""}${lastName.charAt(0) || ""}`.toUpperCase() || "AK";

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account, security and integrations." />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {TABS.map(t=>(
              <button key={t.k} onClick={()=>setTab(t.k)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap ${tab===t.k?"bg-primary/15 text-primary":"text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}>
                <t.icon className="h-4 w-4" /> {t.l}
              </button>
            ))}
          </nav>
        </Card>

        <Card>
          {tab==="profile" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 text-lg font-bold text-white">
                  {initials}
                </div>
                <div>
                  <div className="font-semibold">{fullName}</div>
                  <div className="text-xs text-muted-foreground">{role} · {company}</div>
                </div>
                <button className="ml-auto rounded-lg btn-ghost px-3 py-2 text-sm">Change avatar</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First name"><input className={inp} defaultValue={firstName} key={`fn-${firstName}`} /></Field>
                <Field label="Last name"><input className={inp} defaultValue={lastName} key={`ln-${lastName}`} /></Field>
                <Field label="Email"><input className={inp} defaultValue={email} key={`em-${email}`} /></Field>
                <Field label="Role"><input className={inp} defaultValue={role} key={`rl-${role}`} /></Field>
              </div>
              <SaveBar />
            </div>
          )}

          {tab==="security" && (
            <div className="space-y-4">
              <Row title="Two-factor authentication" desc="Require an authenticator code on every login.">
                <Badge tone="success">Enabled</Badge>
              </Row>
              <Row title="Active sessions" desc="3 devices · last active 2 minutes ago.">
                <button className="rounded-lg btn-ghost px-3 py-2 text-sm">Review</button>
              </Row>
              <Row title="Audit log" desc="All security events for the last 90 days.">
                <button className="rounded-lg btn-ghost px-3 py-2 text-sm">View log</button>
              </Row>
            </div>
          )}

          {tab==="password" && (
            <div className="space-y-3 max-w-md">
              <Field label="Current password"><input type="password" className={inp} /></Field>
              <Field label="New password"><input type="password" className={inp} /></Field>
              <Field label="Confirm new password"><input type="password" className={inp} /></Field>
              <SaveBar />
            </div>
          )}

          {tab==="theme" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { n:"Midnight (default)", c:["#0B1220","#141C2F","#3B82F6"] },
                  { n:"Carbon", c:["#0A0A0A","#161616","#10B981"] },
                  { n:"Aurora", c:["#0B0F1F","#141B33","#8B5CF6"] },
                ].map((t,i)=>(
                  <label key={t.n} className="block cursor-pointer rounded-2xl border border-border bg-secondary/30 p-3 ring-2 ring-transparent hover:ring-primary/40">
                    <div className="flex gap-1">{t.c.map(c=><span key={c} className="h-6 flex-1 rounded" style={{background:c}} />)}</div>
                    <div className="mt-2 flex items-center justify-between text-sm"><span>{t.n}</span>{i===0 && <Badge tone="primary">Active</Badge>}</div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab==="notifications" && (
            <div className="space-y-3">
              {["Fraud alerts","Model deployments","System warnings","Weekly digest"].map(l=>(
                <Row key={l} title={l} desc="Email, in-app and webhook.">
                  <input type="checkbox" defaultChecked className="h-4 w-8 appearance-none rounded-full bg-secondary ring-1 ring-border checked:bg-primary relative cursor-pointer before:absolute before:left-0.5 before:top-0.5 before:h-3 before:w-3 before:rounded-full before:bg-foreground before:transition-transform checked:before:translate-x-4" />
                </Row>
              ))}
            </div>
          )}

          {tab==="api" && (
            <div className="space-y-4">
              <Field label="Production API key">
                <div className="flex gap-2"><input className={`${inp} font-mono`} readOnly value="sk_live_3a7b…f24c" /><button className="rounded-lg btn-ghost px-3 text-sm">Copy</button></div>
              </Field>
              <Field label="Webhook endpoint">
                <input className={inp} defaultValue="https://hooks.northbank.io/fraud" />
              </Field>
              <Field label="Risk threshold (auto-block)">
                <input className={inp} defaultValue="0.85" />
              </Field>
              <SaveBar />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>{children}</label>;
}
function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="text-sm font-medium">{title}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
      {children}
    </div>
  );
}
function SaveBar() {
  return (
    <div className="flex justify-end gap-2 border-t border-border pt-3">
      <button className="rounded-lg btn-ghost px-3 py-2 text-sm">Cancel</button>
      <button className="inline-flex items-center gap-1.5 rounded-lg btn-primary px-3 py-2 text-sm"><Save className="h-4 w-4" />Save changes</button>
    </div>
  );
}
