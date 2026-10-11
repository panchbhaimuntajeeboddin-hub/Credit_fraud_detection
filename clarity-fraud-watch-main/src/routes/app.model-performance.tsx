import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Card, PageHeader, Badge } from "@/components/ui-kit";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/model-performance")({
  head: () => ({ meta: [{ title: "Model performance — Sentinel" }] }),
  component: ModelPage,
});

function ModelPage() {
  const { data, isLoading } = useQuery({
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

  if (isLoading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const metrics = [
    { k: "Accuracy", v: data.accuracy, c: "#3B82F6" },
    { k: "Precision", v: data.precision, c: "#10B981" },
    { k: "Recall", v: data.recall, c: "#F59E0B" },
    { k: "F1 Score", v: data.f1_score, c: "#8B5CF6" },
    { k: "ROC-AUC", v: data.roc_auc, c: "#EF4444" },
  ];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div>
      <PageHeader
        title="Model performance"
        description="Live metrics for the production fraud-detection model."
        actions={<Badge tone="primary">v4.0.0 · production</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((m, i) => (
          <Card key={m.k}>
            <CircleMetric value={m.v} color={m.c} delay={i * 0.08} />
            <div className="mt-3 text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{m.k}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Confusion matrix" subtitle="Evaluated on 56,962 test set events">
          <div className="grid grid-cols-2 gap-2">
            <Cell label="True Negative" value={formatNumber(data.confusion_matrix.tn)} tone="success" />
            <Cell label="False Positive" value={formatNumber(data.confusion_matrix.fp)} tone="warning" />
            <Cell label="False Negative" value={formatNumber(data.confusion_matrix.fn)} tone="danger" />
            <Cell label="True Positive" value={formatNumber(data.confusion_matrix.tp)} tone="primary" />
          </div>
        </Card>
        <Card title="Model lifecycle">
          <ol className="relative space-y-4 border-l border-border pl-4">
            {[
              { t: "v4.0.0 (Random Forest) deployed", s: `AUC ${data.roc_auc}% · ${data.accuracy}% accuracy`, tone: "primary" },
              { t: "Shadow eval passed", s: "Tested on 100% of historical test set", tone: "success" },
              { t: "Trained on creditcard.csv", s: "284,807 transactions with stratified splitting", tone: "violet" },
              { t: "Mock model replaced", s: "Successfully connected Python runtime backend", tone: "warning" },
            ].map((s, i) => (
              <li key={i}>
                <span
                  className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full"
                  style={{
                    background:
                      s.tone === "primary"
                        ? "#3B82F6"
                        : s.tone === "success"
                          ? "#10B981"
                          : s.tone === "violet"
                            ? "#8B5CF6"
                            : "#F59E0B",
                  }}
                />
                <div className="text-sm font-medium">{s.t}</div>
                <div className="text-xs text-muted-foreground">{s.s}</div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone: "success"|"warning"|"danger"|"primary" }) {
  const bg = { success:"bg-success/10 ring-success/25", warning:"bg-warning/10 ring-warning/25", danger:"bg-destructive/10 ring-destructive/25", primary:"bg-primary/10 ring-primary/25" }[tone];
  const fg = { success:"text-success", warning:"text-warning", danger:"text-destructive", primary:"text-primary" }[tone];
  return (
    <div className={`rounded-xl p-4 ring-1 ${bg}`}>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${fg}`}>{value}</div>
    </div>
  );
}

function CircleMetric({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  const R = 42, C = 2 * Math.PI * R;
  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} stroke="rgba(148,163,184,0.12)" strokeWidth="8" fill="none" />
        <motion.circle cx="50" cy="50" r={R} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C - (value/100)*C }} transition={{ duration: 1.2, delay, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="font-display text-xl font-bold" style={{ color }}>{value.toFixed(2)}%</div>
      </div>
    </div>
  );
}
