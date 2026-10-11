import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Filter, MoreHorizontal, Search, FileDown, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, PageHeader } from "@/components/ui-kit";
import { jsPDF } from "jspdf";

export const Route = createFileRoute("/app/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Sentinel" }] }),
  component: TxnPage,
});

type Row = {
  id: string;
  userId?: string;
  customer: string;
  merchant: string;
  merchantCategory: string;
  channel: string;
  location: string;
  cardNetwork: string;
  cardLast4: string;
  amount: number;
  time: string;
  createdAt?: string;
  prediction: "Genuine" | "Fraud";
  risk: "Low" | "Medium" | "High";
  conf: number;
  status: "Approved" | "Blocked" | "Review";
};

function TxnPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | "Genuine" | "Fraud">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Approved" | "Blocked" | "Review">("All");
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "all">("24h");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("sentinel_auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/transactions", { headers });
      if (!response.ok) {
        throw new Error("Failed to load transactions.");
      }
      return (await response.json()) as { transactions: Row[] };
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const allTransactions = data?.transactions ?? [];

  // Filter logic: prediction, status, timeframe, search query
  const rows = useMemo(() => {
    const now = Date.now();
    return allTransactions.filter((r) => {
      // 1. Prediction filter
      if (filter !== "All" && r.prediction !== filter) return false;

      // 2. Status filter
      if (statusFilter !== "All" && r.status !== statusFilter) return false;

      // 3. Timeframe filter (Last 24h, Last 7d, All)
      if (timeframe === "24h" && r.createdAt) {
        const txnTime = new Date(r.createdAt).getTime();
        if (now - txnTime > 24 * 60 * 60 * 1000) return false;
      } else if (timeframe === "7d" && r.createdAt) {
        const txnTime = new Date(r.createdAt).getTime();
        if (now - txnTime > 7 * 24 * 60 * 60 * 1000) return false;
      }

      // 4. Search query
      if (q.trim() !== "") {
        const query = q.toLowerCase();
        const searchable = `${r.id} ${r.customer} ${r.merchant} ${r.merchantCategory} ${r.channel} ${r.location} ${r.cardNetwork} ${r.cardLast4}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      return true;
    });
  }, [allTransactions, filter, statusFilter, timeframe, q]);

  const pageRows = rows.slice(page * pageSize, page * pageSize + pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  const handleExportCsv = () => {
    if (rows.length === 0) {
      alert("No transactions available to export.");
      return;
    }
    const headers = [
      "Transaction ID",
      "Customer",
      "Merchant",
      "Category",
      "Channel",
      "Location",
      "Card Network",
      "Card Last 4",
      "Amount ($)",
      "Time",
      "Created At",
      "Prediction",
      "Risk",
      "Confidence (%)",
      "Status",
    ];
    const escape = (val: unknown) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const csvLines = [headers.join(",")];

    for (const r of rows) {
      csvLines.push([
        escape(r.id),
        escape(r.customer),
        escape(r.merchant),
        escape(r.merchantCategory),
        escape(r.channel),
        escape(r.location),
        escape(r.cardNetwork),
        escape(r.cardLast4),
        r.amount.toFixed(2),
        escape(r.time),
        escape(r.createdAt || ""),
        escape(r.prediction),
        escape(r.risk),
        (r.conf * 100).toFixed(0),
        escape(r.status),
      ].join(","));
    }

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sentinel_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (rows.length === 0) {
      alert("No transactions available to export.");
      return;
    }
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 595.28, 70, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("SENTINEL FRAUD AI", 40, 35);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Transactions Scoring & ML Verification Audit Report", 40, 52);

      const dateStr = new Date().toLocaleString();
      doc.text(`Generated: ${dateStr}`, 370, 38);
      doc.text(`Filter: ${filter} | Time: ${timeframe === "24h" ? "Last 24 Hours" : timeframe === "7d" ? "Last 7 Days" : "All Time"}`, 370, 52);

      // KPI Summary Section
      let y = 100;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Executive Summary", 40, y);

      const totalCount = rows.length;
      const fraudCount = rows.filter((r) => r.prediction === "Fraud").length;
      const genuineCount = totalCount - fraudCount;
      const totalVolume = rows.reduce((acc, r) => acc + r.amount, 0);

      y += 18;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Total Records: ${totalCount}   |   Genuine: ${genuineCount}   |   Fraud Flagged: ${fraudCount}   |   Total Volume: $${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        40,
        y,
      );

      // Table Header
      y += 25;
      doc.setFillColor(241, 245, 249);
      doc.rect(40, y - 12, 515, 20, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      doc.text("TRANSACTION", 45, y);
      doc.text("CUSTOMER", 125, y);
      doc.text("MERCHANT", 205, y);
      doc.text("AMOUNT", 285, y);
      doc.text("TIME", 340, y);
      doc.text("PREDICTION", 390, y);
      doc.text("RISK", 460, y);
      doc.text("STATUS", 505, y);

      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      for (let i = 0; i < Math.min(rows.length, 36); i++) {
        const r = rows[i];
        if (y > 780) {
          doc.addPage();
          y = 40;
        }
        doc.setTextColor(51, 65, 85);
        doc.text(r.id, 45, y);
        doc.text(r.customer.slice(0, 14), 125, y);
        doc.text(r.merchant.slice(0, 13), 205, y);
        doc.text(`$${r.amount.toFixed(2)}`, 285, y);
        doc.text(r.time, 340, y);

        if (r.prediction === "Fraud") {
          doc.setTextColor(220, 38, 38);
        } else {
          doc.setTextColor(22, 163, 74);
        }
        doc.text(r.prediction, 390, y);

        doc.setTextColor(51, 65, 85);
        doc.text(r.risk, 460, y);
        doc.text(r.status, 505, y);

        y += 16;
      }

      if (rows.length > 36) {
        doc.setFont("helvetica", "italic");
        doc.setTextColor(148, 163, 184);
        doc.text(`... and ${rows.length - 36} additional transactions included in export`, 45, y + 10);
      }

      doc.save(`sentinel_transactions_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (pdfErr) {
      console.error("PDF generation exception:", pdfErr);
      window.print();
    }
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="All authorized transactions in the last 24h with live ML scoring."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-lg btn-ghost px-3 py-2 text-sm disabled:opacity-50"
              title="Refresh transactions list"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg btn-ghost px-3 py-2 text-sm"
              title="Export filtered transactions as CSV"
            >
              <FileDown className="h-4 w-4" /> CSV
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-lg btn-ghost px-3 py-2 text-sm"
              title="Export transactions report as PDF"
            >
              <Download className="h-4 w-4" /> PDF
            </button>
          </div>
        }
      />

      {isError && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error instanceof Error ? error.message : "Failed to load transactions."}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}

      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Search by ID, customer, merchant, location, card…"
              className="h-10 w-full rounded-lg border border-border bg-secondary/40 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Prediction Filter */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 p-1">
            {(["All", "Genuine", "Fraud"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setFilter(t);
                  setPage(0);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === t ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 p-1">
            {[
              { k: "24h", label: "Last 24h" },
              { k: "7d", label: "Last 7d" },
              { k: "all", label: "All Time" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => {
                  setTimeframe(t.k as typeof timeframe);
                  setPage(0);
                }}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  timeframe === t.k ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Filter dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(0);
              }}
              className="h-9 rounded-lg border border-border bg-secondary/40 px-2.5 text-xs text-foreground outline-none focus:border-primary/60"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Blocked">Blocked</option>
              <option value="Review">Review</option>
            </select>
          </div>
        </div>

        {/* Loading Spinner State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="mt-3 text-sm font-medium">Loading transactions from database…</div>
          </div>
        )}

        {/* Table View */}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  {["Transaction", "Customer", "Merchant", "Category", "Channel", "Amount", "Time", "Prediction", "Risk", "Confidence", "Status", ""].map((h) => (
                    <th key={h} className="border-b border-border px-3 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 transition-colors hover:bg-secondary/30">
                    <td className="px-3 py-3 font-mono text-xs text-foreground font-semibold">{r.id}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-[10px] font-bold text-white">
                          {r.customer
                            .split(" ")
                            .map((x) => x[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <span className="font-medium">{r.customer}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{r.merchant}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.merchantCategory}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.channel}</td>
                    <td className="px-3 py-3 font-mono font-semibold">${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{r.time}</td>
                    <td className="px-3 py-3">
                      <Badge tone={r.prediction === "Fraud" ? "danger" : "success"}>{r.prediction}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={r.risk === "High" ? "danger" : r.risk === "Medium" ? "warning" : "success"}>{r.risk}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                          <div className={`h-full rounded-full ${r.prediction === "Fraud" ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min(100, r.conf * 100)}%` }} />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">{(r.conf * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={r.status === "Blocked" ? "danger" : r.status === "Review" ? "warning" : "success"}>{r.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-secondary" aria-label="Transaction options">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Empty State: Zero matches after filtering */}
                {pageRows.length === 0 && allTransactions.length > 0 && (
                  <tr>
                    <td colSpan={12} className="px-3 py-12 text-center">
                      <div className="text-sm font-medium text-foreground">No transactions match your current filters.</div>
                      <div className="mt-1 text-xs text-muted-foreground">Try clearing search terms or changing time range and prediction status.</div>
                      <button
                        onClick={() => {
                          setQ("");
                          setFilter("All");
                          setStatusFilter("All");
                          setTimeframe("all");
                        }}
                        className="mt-3 rounded-lg btn-ghost px-3 py-1.5 text-xs text-primary"
                      >
                        Reset filters
                      </button>
                    </td>
                  </tr>
                )}

                {/* Empty State: Zero transactions in workspace */}
                {pageRows.length === 0 && allTransactions.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-3 py-16 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div className="mt-3 text-base font-semibold text-foreground">No transactions recorded yet</div>
                      <div className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                        Transactions submitted through the Predict page are automatically scored and saved to your database.
                      </div>
                      <div className="mt-4">
                        <Link
                          to="/app/predictions"
                          className="inline-flex items-center gap-2 rounded-lg btn-primary px-4 py-2 text-xs font-semibold"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Run first prediction
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!isLoading && rows.length > 0 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-xs text-muted-foreground">
              Showing {pageRows.length} of {rows.length} {rows.length === 1 ? "transaction" : "transactions"}
              {allTransactions.length !== rows.length && ` (filtered from ${allTransactions.length} total)`}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="grid h-8 w-8 place-items-center rounded-md btn-ghost disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`h-8 min-w-8 rounded-md px-2 text-xs font-medium transition-colors ${
                    page === i ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="grid h-8 w-8 place-items-center rounded-md btn-ghost disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
