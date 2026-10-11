import { ShieldCheck } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-violet-500 shadow-lg shadow-primary/30">
        <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.4} />
        <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/15" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-base font-bold tracking-tight">Sentinel</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Fraud&nbsp;AI</div>
      </div>
    </div>
  );
}
