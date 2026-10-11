import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Activity, Lock } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="pointer-events-none absolute inset-0 ring-grid opacity-30 [mask-image:radial-gradient(50%_50%_at_50%_30%,#000_30%,transparent_75%)]" />
      <div className="relative flex flex-col justify-between p-8 sm:p-10">
        <Link to="/"><Logo /></Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-md"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </motion.div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Sentinel Labs · SOC 2 Type II · PCI-DSS</div>
      </div>
      <div className="relative hidden overflow-hidden border-l border-border bg-surface-2 lg:block">
        <div className="absolute -left-20 top-10 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-10 bottom-10 h-[420px] w-[420px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center px-10">
          <div className="rounded-2xl glass-strong p-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>
              Live model · 38ms p50
            </div>
            <div className="mt-3 font-display text-2xl font-bold leading-tight">"Sentinel cut our fraud losses by 63% in one quarter."</div>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs font-bold">PM</div>
              <div>
                <div className="text-sm font-medium">Priya Menon</div>
                <div className="text-xs text-muted-foreground">Head of Risk · Northbank</div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { icon: ShieldCheck, t: "PCI-DSS aligned" },
              { icon: Lock, t: "End-to-end encryption" },
              { icon: Activity, t: "Sub-50ms scoring" },
              { icon: Sparkles, t: "Explainable ML" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2.5 text-xs text-muted-foreground">
                <f.icon className="h-4 w-4 text-primary" />{f.t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {hint}
      </div>
      {children}
    </label>
  );
}

export const inputCls =
  "h-11 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/30";
