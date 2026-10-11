import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, Upload, ShieldCheck, ShieldAlert, Gauge as GaugeIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, PageHeader, Badge } from "@/components/ui-kit";

export const Route = createFileRoute("/app/predictions")({
  head: () => ({ meta: [{ title: "Predict — Sentinel" }] }),
  component: PredictPage,
});

const MERCHANT_OPTIONS = [
  "Amazon",
  "FastMart",
  "Uber",
  "Starbucks",
  "Apple",
  "Netflix",
  "Shell",
  "IKEA",
  "Zara",
  "Steam",
];

const MERCHANT_CATEGORY_MAP: Record<string, string> = {
  Amazon: "Retail",
  FastMart: "Convenience",
  Uber: "Travel",
  Starbucks: "Food & Beverage",
  Apple: "Electronics",
  Netflix: "Entertainment",
  Shell: "Fuel",
  IKEA: "Home",
  Zara: "Apparel",
  Steam: "Gaming",
};

const CARD_NETWORKS = ["Visa", "Mastercard", "Amex", "Discover"];
const CHANNEL_OPTIONS = ["E-commerce", "In-store", "Mobile app", "Contactless"];

function getDeterministicFeatures(
  merchant: string,
  channel: string,
  location: string,
  cardNetwork: string,
  amount: number
) {
  const str = `${merchant}-${channel}-${location}-${cardNetwork}`;
  const features = new Array(28).fill(0);
  
  // Base deterministic values
  for (let i = 0; i < 28; i++) {
    let hash = 0;
    const seed = `${str}-${i}`;
    for (let j = 0; j < seed.length; j++) {
      hash = (hash << 5) - hash + seed.charCodeAt(j);
      hash |= 0;
    }
    // Normal range [-0.8, 0.8]
    features[i] = Math.round(((hash % 100) / 125) * 1000) / 1000;
  }
  
  // Calculate a risk score based on inputs
  let isHighRisk = false;
  
  // Risk triggers
  if (amount > 1200) isHighRisk = true; // High amounts
  if (merchant === "Steam" && amount > 150) isHighRisk = true; // Online gaming purchases
  if (merchant === "Apple" && amount > 800) isHighRisk = true; // High-end electronics
  if (location.toLowerCase().includes("unknown") || location.toLowerCase().includes("suspicious")) isHighRisk = true;
  
  if (isHighRisk) {
    // Skew features to resemble typical Kaggle fraud profiles
    // Negatives on V17, V14, V12, V10, V16, V3, V7, V1, V18
    features[16] = -10.0; // V17
    features[13] = -12.0; // V14
    features[11] = -9.0;  // V12
    features[9] = -8.0;   // V10
    features[15] = -7.0;  // V16
    features[2] = -6.0;   // V3
    features[6] = -5.0;   // V7
    features[0] = -5.0;   // V1
    features[17] = -4.0;  // V18
    
    // Positives on V4, V11, V2, V19
    features[3] = 6.0;    // V4
    features[10] = 5.0;   // V11
    features[1] = 5.0;    // V2
    features[18] = 3.0;   // V19
  } else {
    // Normal transaction: ensure features stay within non-fraud bounds
    // Keep V17, V14 etc. positive or small negative
    features[16] = Math.round((0.1 + (Math.abs(str.charCodeAt(0)) % 10) / 20) * 1000) / 1000;
    features[13] = Math.round((0.2 + (Math.abs(str.charCodeAt(1)) % 8) / 20) * 1000) / 1000;
    features[3] = Math.round((-0.2 - (Math.abs(str.charCodeAt(2)) % 5) / 20) * 1000) / 1000;
  }
  
  return features;
}

function PredictPage() {
  const queryClient = useQueryClient();
  const [transactionId, setTransactionId] = useState("TXN-284456");
  const [customer, setCustomer] = useState("Priya Menon");
  const [merchant, setMerchant] = useState("Amazon");
  const [merchantCategory, setMerchantCategory] = useState("Retail");
  const [cardNetwork, setCardNetwork] = useState("Visa");
  const [cardLast4, setCardLast4] = useState("2241");
  const [channel, setChannel] = useState("E-commerce");
  const [location, setLocation] = useState("San Francisco, US");
  const [amount, setAmount] = useState("248.50");
  const [time, setTime] = useState("14:32");
  const [features, setFeatures] = useState<number[]>(() =>
    Array.from({ length: 28 }, () => Math.round((Math.random() * 4 - 2) * 1000) / 1000),
  );
  const [result, setResult] = useState<null | { fraud: boolean; prob: number }>(null);
  const [lastSavedTxn, setLastSavedTxn] = useState<null | { id: string; prediction: string; amount: number }>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [autoDerive, setAutoDerive] = useState(true);
  
  useEffect(() => {
    setMerchantCategory(MERCHANT_CATEGORY_MAP[merchant] ?? "Retail");
  }, [merchant]);

  useEffect(() => {
    if (!autoDerive) return;
    const amt = parseFloat(amount) || 0;
    const derived = getDeterministicFeatures(merchant, channel, location, cardNetwork, amt);
    setFeatures(derived);
  }, [merchant, channel, location, cardNetwork, amount, autoDerive]);

  const [batchResult, setBatchResult] = useState<null | {
    total: number;
    fraudCount: number;
    genuineCount: number;
    fraudTransactions: Array<{ index: number; amount: number; time: string | number; prob: number }>;
  }>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async (payload: {
      transactionId: string;
      customer: string;
      merchant: string;
      merchantCategory: string;
      cardNetwork: string;
      cardLast4: string;
      channel: string;
      location: string;
      amount: string;
      time: string;
      features: number[];
    }) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("sentinel_auth_token") : null;
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/predict", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Prediction request failed.");
      }
      return response.json() as Promise<{
        success: boolean;
        fraud: boolean;
        prob: number;
        transaction?: { id: string; prediction: string; amount: number };
      }>;
    },
    onSuccess: (data) => {
      setResult({ fraud: data.fraud, prob: data.prob });
      setErrorMsg("");
      if (data.transaction) {
        setLastSavedTxn(data.transaction);
      }
      // Immediately invalidate transactions cache so Transactions page displays new prediction
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Suggest next unique ID for subsequent test
      setTransactionId(`TXN-${Math.floor(284000 + Math.random() * 700000)}`);
    },
    onError: (err: unknown) => {
      setResult(null);
      setLastSavedTxn(null);
      setErrorMsg(err instanceof Error ? err.message : "Prediction request failed.");
    },
  });

  const loading = mutation.isPending;

  const predict = () => {
    setResult(null);
    setBatchResult(null);
    setErrorMsg("");
    setLastSavedTxn(null);
    mutation.mutate({
      transactionId,
      customer,
      merchant,
      merchantCategory,
      cardNetwork,
      cardLast4,
      channel,
      location,
      amount,
      time,
      features,
    });
  };

  const reset = () => {
    setTransactionId("TXN-284456");
    setCustomer("Priya Menon");
    setMerchant("Amazon");
    setMerchantCategory("Retail");
    setCardNetwork("Visa");
    setCardLast4("2241");
    setChannel("E-commerce");
    setLocation("San Francisco, US");
    setAmount("0");
    setTime("00:00");
    setFeatures(Array.from({ length: 28 }, () => 0));
    setResult(null);
    setBatchResult(null);
    setErrorMsg("");
    setLastSavedTxn(null);
  };

  const setFeature = (index: number, value: string) => {
    const next = [...features];
    next[index] = Number(value) || 0;
    setFeatures(next);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResult(null);
    setBatchResult(null);
    setBatchLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error("Empty file content");
        }

        const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          throw new Error("Insufficient rows in CSV file");
        }

        // Detect if first row is header
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const hasHeader = headers.includes("amount") || headers.includes("time") || headers.includes("v1");

        const dataStartIdx = hasHeader ? 1 : 0;
        const transactions: Array<{ time: string | number; amount: number; features: number[] }> = [];

        let timeIdx = 0;
        let amountIdx = 29;
        let vIndices = Array.from({ length: 28 }, (_, i) => i + 1);

        if (hasHeader) {
          timeIdx = headers.indexOf("time");
          amountIdx = headers.indexOf("amount");
          for (let i = 0; i < 28; i++) {
            const idx = headers.indexOf(`v${i + 1}`);
            if (idx !== -1) {
              vIndices[i] = idx;
            }
          }
        }

        // Limit batch size to 500 records to keep API responsive
        const limit = Math.min(lines.length - dataStartIdx, 500);
        for (let i = 0; i < limit; i++) {
          const lineIdx = dataStartIdx + i;
          const cols = lines[lineIdx].split(",").map(c => c.trim());
          if (cols.length < 30) continue;

          const timeVal = cols[timeIdx] || "0";
          const amountVal = Number(cols[amountIdx]) || 0;
          const featuresVal = vIndices.map(idx => Number(cols[idx]) || 0);

          transactions.push({
            time: timeVal,
            amount: amountVal,
            features: featuresVal
          });
        }

        if (transactions.length === 0) {
          throw new Error("No valid transactions parsed from CSV");
        }

        const response = await fetch("/api/predict-batch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(transactions)
        });

        if (!response.ok) {
          throw new Error("Batch prediction service returned an error");
        }

        const predictions: Array<{ fraud: boolean; prob: number }> = await response.json();
        
        let fraudCount = 0;
        const fraudTransactions: Array<{ index: number; amount: number; time: string | number; prob: number }> = [];

        predictions.forEach((pred, index) => {
          if (pred.fraud) {
            fraudCount++;
            fraudTransactions.push({
              index: index + 1 + dataStartIdx,
              amount: transactions[index].amount,
              time: transactions[index].time,
              prob: pred.prob
            });
          }
        });

        setBatchResult({
          total: transactions.length,
          fraudCount,
          genuineCount: transactions.length - fraudCount,
          fraudTransactions
        });
      } catch (err: any) {
        console.error("Batch prediction error:", err);
        alert(err.message || "Failed to process the CSV batch prediction");
      } finally {
        setBatchLoading(false);
        // Reset file input value so same file can be uploaded again
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <PageHeader
        title="Predict transaction"
        description="Score a real-looking card transaction with merchant, channel, card details, and model metadata."
        actions={
          <>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCsvUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg btn-ghost px-3 py-2 text-sm cursor-pointer"
            >
              <Upload className="h-4 w-4" /> Upload CSV
            </button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Transaction details" subtitle="Enter realistic transaction metadata before scoring.">
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldRow label="Transaction ID"><input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className={inp} /></FieldRow>
            <FieldRow label="Customer name"><input value={customer} onChange={(e) => setCustomer(e.target.value)} className={inp} /></FieldRow>
            <FieldRow label="Merchant">
              <select value={merchant} onChange={(e) => setMerchant(e.target.value)} className={inp}>
                {MERCHANT_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Category"><input value={merchantCategory} readOnly className={inp + " bg-secondary/70 cursor-not-allowed"} /></FieldRow>
            <FieldRow label="Card network">
              <select value={cardNetwork} onChange={(e) => setCardNetwork(e.target.value)} className={inp}>
                {CARD_NETWORKS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Card last 4"><input value={cardLast4} onChange={(e) => setCardLast4(e.target.value)} maxLength={4} className={inp} /></FieldRow>
            <FieldRow label="Channel">
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inp}>
                {CHANNEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} className={inp} /></FieldRow>
            <FieldRow label="Amount (USD)"><input value={amount} onChange={(e) => setAmount(e.target.value)} className={inp} /></FieldRow>
            <FieldRow label="Time (24h)"><input value={time} onChange={(e) => setTime(e.target.value)} className={inp} /></FieldRow>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Model inputs</span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoDerive}
                  onChange={(e) => setAutoDerive(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
                Auto-derive from metadata
              </label>
            </div>
            <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
              {features.map((value, index) => (
                <label key={index} className="block">
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">V{index + 1}</div>
                  <input
                    value={value}
                    onChange={(e) => setFeature(index, e.target.value)}
                    disabled={autoDerive}
                    className={`${inp} font-mono text-xs ${autoDerive ? "opacity-60 cursor-not-allowed bg-secondary/20" : ""}`}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={predict}
              disabled={loading || batchLoading}
              className="inline-flex items-center gap-2 rounded-lg btn-primary px-4 py-2.5 text-sm font-semibold"
            >
              <Sparkles className="h-4 w-4" /> Predict fraud
            </button>
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg btn-ghost px-4 py-2.5 text-sm">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </Card>

        <Card title="Prediction result">
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
            {(loading || batchLoading) && (
              <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 py-6">
                <div className="mx-auto h-32 w-32 rounded-full shimmer" />
                <div className="mx-auto h-3 w-32 rounded-full shimmer" />
                <div className="mx-auto h-3 w-48 rounded-full shimmer" />
              </motion.div>
            )}
            {!(loading || batchLoading) && !result && !batchResult && (
              <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground"><GaugeIcon className="h-6 w-6" /></div>
                <div className="mt-3 text-sm font-medium">Awaiting input</div>
                <div className="text-xs text-muted-foreground">Fill the features and click Predict, or upload a CSV file.</div>
              </motion.div>
            )}
            {!(loading || batchLoading) && result && (
              <motion.div key="r" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Gauge prob={result.prob} />
                <div className={`mt-4 flex items-center gap-2 rounded-xl p-3 ring-1 ${result.fraud ? "bg-destructive/10 ring-destructive/30" : "bg-success/10 ring-success/30"}`}>
                  {result.fraud ? <ShieldAlert className="h-5 w-5 text-destructive" /> : <ShieldCheck className="h-5 w-5 text-success" />}
                  <div>
                    <div className="text-sm font-semibold">{result.fraud ? "Fraudulent transaction" : "Genuine transaction"}</div>
                    <div className="text-xs text-muted-foreground">Model confidence {(Math.max(result.prob, 1 - result.prob) * 100).toFixed(1)}%</div>
                  </div>
                </div>

                {lastSavedTxn && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-xs text-success">
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Saved to database as <span className="font-mono font-semibold">{lastSavedTxn.id}</span></span>
                    </div>
                    <Link to="/app/transactions" className="font-semibold underline hover:opacity-80">
                      View in Transactions →
                    </Link>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-secondary/40 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Risk level</div>
                    <div className="mt-1"><Badge tone={result.prob > 0.8 ? "danger" : result.prob > 0.5 ? "warning" : "success"}>{result.prob > 0.8 ? "High" : result.prob > 0.5 ? "Medium" : "Low"}</Badge></div>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Action</div>
                    <div className="mt-1 text-xs font-medium">{result.fraud ? "Block & alert" : "Auto-approve"}</div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="text-xs text-muted-foreground">Transaction ID</div>
                    <div className="text-sm font-medium font-mono">{lastSavedTxn?.id || transactionId}</div>
                    <div className="text-xs text-muted-foreground">Merchant</div>
                    <div className="text-sm font-medium">{merchant} · {merchantCategory}</div>
                    <div className="text-xs text-muted-foreground">Channel</div>
                    <div className="text-sm font-medium">{channel} · {location}</div>
                    <div className="text-xs text-muted-foreground">Card</div>
                    <div className="text-sm font-medium">{cardNetwork} •• {cardLast4}</div>
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="text-sm font-medium">${Number(amount).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Timestamp</div>
                    <div className="text-sm font-medium">{time}</div>
                  </div>
                </div>
              </motion.div>
            )}
            {!(loading || batchLoading) && batchResult && (
              <motion.div key="b" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold font-display">{batchResult.total}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Transactions processed</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-success/10 p-2 ring-1 ring-success/20">
                    <div className="text-xs font-semibold text-success">{batchResult.genuineCount}</div>
                    <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Genuine Approved</div>
                  </div>
                  <div className="rounded-lg bg-destructive/10 p-2 ring-1 ring-destructive/20">
                    <div className="text-xs font-semibold text-destructive">{batchResult.fraudCount}</div>
                    <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Fraud Flagged</div>
                  </div>
                </div>
                {batchResult.fraudCount > 0 ? (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Flagged transactions</div>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {batchResult.fraudTransactions.map((tx) => (
                        <div key={tx.index} className="flex justify-between items-center bg-secondary/30 p-2 rounded-lg text-xs font-mono">
                          <div>
                            <span className="text-muted-foreground">Row #{tx.index}:</span> <span className="font-semibold text-destructive">${tx.amount.toFixed(2)}</span>
                          </div>
                          <div>
                            <Badge tone="danger">{(tx.prob * 100).toFixed(0)}% risk</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 rounded-xl bg-success/5 border border-dashed border-success/20 text-xs text-success font-medium">
                    All transactions validated as genuine!
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}

const inp = "h-10 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30";

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>{children}</label>;
}

function Gauge({ prob }: { prob: number }) {
  const angle = prob * 180 - 90; // -90..90
  const color = prob > 0.8 ? "#EF4444" : prob > 0.5 ? "#F59E0B" : "#10B981";
  return (
    <div className="relative mx-auto h-40 w-full max-w-[260px]">
      <svg viewBox="0 0 200 120" className="w-full">
        <defs>
          <linearGradient id="gg" x1="0" x2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>
        <path d="M10 110 A90 90 0 0 1 190 110" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="16" strokeLinecap="round"/>
        <motion.path d="M10 110 A90 90 0 0 1 190 110" fill="none" stroke="url(#gg)" strokeWidth="16" strokeLinecap="round"
          strokeDasharray="283" initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 283 - prob * 283 }} transition={{ duration: 1, ease: "easeOut" }} />
        <motion.line x1="100" y1="110" x2="100" y2="30" stroke={color} strokeWidth="3" strokeLinecap="round"
          initial={{ rotate: -90 }} animate={{ rotate: angle }} style={{ originX: "100px", originY: "110px" }} transition={{ type: "spring", stiffness: 80, damping: 14 }} />
        <circle cx="100" cy="110" r="6" fill={color} />
      </svg>
      <div className="absolute inset-x-0 bottom-2 text-center">
        <div className="font-display text-2xl font-bold" style={{ color }}>{(prob * 100).toFixed(1)}%</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Fraud probability</div>
      </div>
    </div>
  );
}
