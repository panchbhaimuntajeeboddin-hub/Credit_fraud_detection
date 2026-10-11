import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, Printer, FileDown, CalendarRange } from "lucide-react";
import { Card, PageHeader, Badge } from "@/components/ui-kit";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports — Sentinel" }] }),
  component: ReportsPage,
});

const REPORTS = [
  { t: "Fraud summary — November 2025", d: "Portfolio-wide overview with merchant and channel breakdowns.", tag: "Monthly", size: "1.2 MB" },
  { t: "Accuracy report — Q3 2025", d: "Confusion matrix, precision/recall and drift analysis.", tag: "Quarterly", size: "3.4 MB" },
  { t: "Model performance v3.2", d: "Benchmarks for ensemble model vs baseline.", tag: "Model", size: "780 KB" },
  { t: "Regulatory disclosure — PCI", d: "Controls evidence and policy attestations.", tag: "Compliance", size: "5.1 MB" },
];

function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate, export and share board-ready fraud reports."
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-lg btn-ghost px-3 py-2 text-sm"><CalendarRange className="h-4 w-4" /> Date range</button>
            <button className="inline-flex items-center gap-1.5 rounded-lg btn-primary px-3 py-2 text-sm"><FileText className="h-4 w-4" /> New report</button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r,i)=>(
          <Card key={i}>
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><FileText className="h-5 w-5"/></div>
              <Badge tone="primary">{r.tag}</Badge>
            </div>
            <div className="mt-4 font-display text-base font-semibold leading-snug">{r.t}</div>
            <p className="mt-1.5 text-xs text-muted-foreground">{r.d}</p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div className="text-[11px] text-muted-foreground">PDF · {r.size}</div>
              <div className="flex gap-1">
                <button className="grid h-8 w-8 place-items-center rounded-md btn-ghost" title="Download PDF"><Download className="h-4 w-4" /></button>
                <button className="grid h-8 w-8 place-items-center rounded-md btn-ghost" title="Export CSV"><FileDown className="h-4 w-4" /></button>
                <button className="grid h-8 w-8 place-items-center rounded-md btn-ghost" title="Print"><Printer className="h-4 w-4" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Card title="Recent activity">
          <ul className="divide-y divide-border text-sm">
            {[
              "Sarah generated 'Fraud summary — November 2025'",
              "Auto-export scheduled: weekly PCI evidence",
              "Daniel printed 'Accuracy report — Q3 2025'",
              "API: report.compliance.export consumed (200 OK)",
            ].map((x,i)=>(
              <li key={i} className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">{x}</span>
                <span className="text-[11px] text-muted-foreground">{i+2}h ago</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
