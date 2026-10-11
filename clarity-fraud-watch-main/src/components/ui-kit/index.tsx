import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary",
  suffix,
  index = 0,
}: {
  label: string;
  value: string | number;
  delta?: number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "danger" | "warning" | "violet";
  suffix?: string;
  index?: number;
}) {
  const tones: Record<string, string> = {
    primary: "from-primary/25 to-primary/0 text-primary",
    success: "from-success/25 to-success/0 text-success",
    danger: "from-destructive/25 to-destructive/0 text-destructive",
    warning: "from-warning/25 to-warning/0 text-warning",
    violet: "from-violet-500/25 to-violet-500/0 text-violet-300",
  };
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="stat-glow relative overflow-hidden rounded-2xl card-elevated p-5"
    >
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${tones[tone]} blur-2xl opacity-60`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <div className="font-display text-2xl font-bold tracking-tight">{value}</div>
            {suffix && <div className="text-sm text-muted-foreground">{suffix}</div>}
          </div>
          {typeof delta === "number" && (
            <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}% vs last week
            </div>
          )}
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tones[tone]} ring-1 ring-white/5`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", title, subtitle, action }: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl card-elevated p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <div className="font-display text-sm font-semibold">{title}</div>}
            {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "success" | "warning" | "danger" | "primary" | "muted" }) {
  const map: Record<string, string> = {
    success: "bg-success/12 text-success ring-success/25",
    warning: "bg-warning/12 text-warning ring-warning/25",
    danger: "bg-destructive/12 text-destructive ring-destructive/25",
    primary: "bg-primary/12 text-primary ring-primary/25",
    muted: "bg-secondary/60 text-muted-foreground ring-border",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${map[tone]}`}>
      {children}
    </span>
  );
}
