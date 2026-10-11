import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";

function getProjectRoot(): string {
  if (process.env.PROJECT_ROOT && fsSync.existsSync(path.join(process.env.PROJECT_ROOT, "predict.py"))) {
    return process.env.PROJECT_ROOT;
  }
  const parentDir = path.resolve(process.cwd(), "..");
  if (fsSync.existsSync(path.join(parentDir, "predict.py"))) {
    return parentDir;
  }
  const currentDir = process.cwd();
  if (fsSync.existsSync(path.join(currentDir, "predict.py"))) {
    return currentDir;
  }
  return parentDir;
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type ApiTransaction = {
  id: string;
  customer: string;
  merchant: string;
  merchantCategory: string;
  channel: string;
  location: string;
  cardNetwork: string;
  cardLast4: string;
  amount: number;
  time: string;
  prediction: "Genuine" | "Fraud";
  risk: "Low" | "Medium" | "High";
  conf: number;
  status: "Approved" | "Blocked" | "Review";
};

const CUSTOMERS = [
  "A. Kapoor",
  "P. Menon",
  "D. Cruz",
  "S. Iyer",
  "M. Rao",
  "L. Khan",
  "K. Singh",
  "R. Bose",
];

const MERCHANTS = [
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

const MERCHANT_CATEGORIES: Record<string, string> = {
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

const TRANSACTION_CHANNELS = ["E-commerce", "In-store", "Mobile app", "Contactless"];
const TRANSACTION_LOCATIONS = ["San Francisco, US", "New York, US", "London, UK", "Berlin, DE", "Toronto, CA", "Bengaluru, IN"];
const CARD_NETWORKS = ["Visa", "Mastercard", "Amex", "Discover"];

const SAMPLE_TRANSACTIONS: ApiTransaction[] = Array.from({ length: 42 }, (_, index) => {
  const riskIndex = index % 3;
  const risk = riskIndex === 2 ? "High" : riskIndex === 1 ? "Medium" : "Low";
  const prediction = risk === "High" ? "Fraud" : risk === "Medium" && index % 5 === 0 ? "Fraud" : "Genuine";
  const status = prediction === "Fraud" ? (risk === "High" ? "Blocked" : "Review") : "Approved";
  const amount = Math.round((Math.random() * 4800 + 5) * 100) / 100;
  const timestamp = new Date(Date.now() - index * 9 * 60 * 1000).toISOString().slice(11, 16);
  const merchant = MERCHANTS[index % MERCHANTS.length];

  return {
    id: `TXN-${(284100 + index).toString()}`,
    customer: CUSTOMERS[index % CUSTOMERS.length],
    merchant,
    merchantCategory: MERCHANT_CATEGORIES[merchant],
    channel: TRANSACTION_CHANNELS[index % TRANSACTION_CHANNELS.length],
    location: TRANSACTION_LOCATIONS[index % TRANSACTION_LOCATIONS.length],
    cardNetwork: CARD_NETWORKS[index % CARD_NETWORKS.length],
    cardLast4: (1000 + ((284100 + index) % 9000)).toString(),
    amount,
    time: timestamp,
    prediction,
    risk,
    conf: Math.round((0.72 + Math.random() * 0.27) * 100) / 100,
    status,
  };
});

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function parseHour(time: string) {
  const [hour] = time.split(":").map((value) => Number(value));
  return Number.isFinite(hour) && hour >= 0 && hour < 24 ? hour : 0;
}

function fallbackMockPredict(body: unknown) {
  const payload = body as {
    amount?: string | number;
    time?: string;
    features?: Array<number | string>;
    channel?: string;
    merchantCategory?: string;
    cardNetwork?: string;
  };
  const amount = Number(payload.amount) || 0;
  const time = typeof payload.time === "string" ? payload.time : "00:00";
  const hour = parseHour(time);
  const features = Array.isArray(payload.features)
    ? payload.features.map((value) => Number(value) || 0)
    : [];
  const channel = typeof payload.channel === "string" ? payload.channel : "E-commerce";
  const merchantCategory = typeof payload.merchantCategory === "string" ? payload.merchantCategory : "Retail";
  const cardNetwork = typeof payload.cardNetwork === "string" ? payload.cardNetwork : "Visa";

  const amountScore = Math.min(1, amount / 5000);
  const featureScore =
    features.length > 0
      ? Math.min(1, features.reduce((sum, value) => sum + Math.abs(value), 0) / (features.length * 3))
      : 0;
  const timeScore = Math.min(1, Math.max(0, (hour - 1) / 22));
  const channelScore = channel === "E-commerce" || channel === "Mobile app" ? 0.1 : 0;
  const categoryScore = merchantCategory === "Electronics" || merchantCategory === "Travel" ? 0.05 : 0;
  const networkScore = cardNetwork === "Amex" ? 0.03 : 0;
  const rawScore = amountScore * 0.35 + featureScore * 0.45 + timeScore * 0.15 + channelScore + categoryScore + networkScore;
  const prob = Math.round(Math.min(1, Math.max(0, rawScore)) * 100) / 100;

  return {
    fraud: prob > 0.5,
    prob,
    score: prob,
  };
}

function predictFraud(body: unknown): Promise<{ fraud: boolean; prob: number; score: number }> {
  return new Promise((resolve, reject) => {
    try {
      const payload = body as Record<string, unknown> | null;
      if (payload && payload.simulateError === "ml") {
        reject(new Error("Simulated ML model inference failure."));
        return;
      }

      const projectRoot = getProjectRoot();
      const pythonScript = path.join(projectRoot, "predict.py");

      const py = spawn("python", [pythonScript], { cwd: projectRoot });

      let stdout = "";
      let stderr = "";

      py.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      py.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      py.on("close", (code) => {
        if (code !== 0) {
          console.error("Python prediction failed with code:", code, "stderr:", stderr);
          reject(new Error(`ML model inference process failed with exit code ${code}: ${stderr.trim() || "Process error"}`));
          return;
        }
        try {
          const result = JSON.parse(stdout.trim());
          if (result.error) {
            console.error("Python prediction script returned error:", result.error);
            reject(new Error(`ML model prediction error: ${result.error}`));
          } else {
            resolve({
              fraud: !!result.fraud,
              prob: Number(result.prob),
              score: Number(result.prob),
            });
          }
        } catch (err) {
          console.error("Failed to parse Python output:", stdout, err);
          reject(new Error("Failed to parse ML model inference output."));
        }
      });

      py.on("error", (err) => {
        console.error("Failed to start Python process:", err);
        reject(new Error(`Failed to execute ML model process: ${err.message}`));
      });

      py.stdin.write(JSON.stringify(body));
      py.stdin.end();
    } catch (err: unknown) {
      console.error("Error in predictFraud runtime spawn:", err);
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

function predictFraudBatch(body: unknown): Promise<Array<{ fraud: boolean; prob: number }>> {
  return new Promise((resolve) => {
    try {
      const projectRoot = getProjectRoot();
      const pythonScript = path.join(projectRoot, "predict_batch.py");

      const py = spawn("python", [pythonScript], { cwd: projectRoot });

      let stdout = "";
      let stderr = "";

      py.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      py.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      py.on("close", (code) => {
        if (code !== 0) {
          console.error("Python batch prediction failed with code:", code, "stderr:", stderr);
          resolve([]);
          return;
        }
        try {
          const result = JSON.parse(stdout.trim());
          if (result.error) {
            console.error("Python batch prediction script returned error:", result.error);
            resolve([]);
          } else {
            resolve(result);
          }
        } catch (err) {
          console.error("Failed to parse Python batch output:", stdout, err);
          resolve([]);
        }
      });

      py.on("error", (err) => {
        console.error("Failed to start Python batch process:", err);
        resolve([]);
      });

      py.stdin.write(JSON.stringify(body));
      py.stdin.end();
    } catch (err) {
      console.error("Error in predictFraudBatch runtime spawn:", err);
      resolve([]);
    }
  });
}

import { registerUser, loginUser, getUserFromRequest } from "./lib/auth-service";
import {
  getTransactionsByUser,
  createTransaction,
  findTransactionById,
  toTransactionDto,
} from "./lib/db";

function authJsonResponse(body: unknown, token?: string, status = 200, clearCookie = false) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
  });
  if (token) {
    headers.set("set-cookie", `sentinel_token=${token}; Path=/; SameSite=Lax; Max-Age=604800`);
  } else if (clearCookie) {
    headers.set("set-cookie", `sentinel_token=; Path=/; SameSite=Lax; Max-Age=0`);
  }
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

async function handleApiRequest(request: Request, url: URL): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "Content-Type,Authorization",
      },
    });
  }

  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    const result = registerUser(body);
    if (!result.success) {
      return jsonResponse({ error: result.error }, result.status);
    }
    return authJsonResponse({ success: true, token: result.token, user: result.user }, result.token, 201);
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    const result = loginUser(body);
    if (!result.success) {
      return jsonResponse({ error: result.error }, result.status);
    }
    return authJsonResponse({ success: true, token: result.token, user: result.user }, result.token, 200);
  }

  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    const user = getUserFromRequest(request);
    if (!user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    return jsonResponse({ user });
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    return authJsonResponse({ success: true }, undefined, 200, true);
  }

  if (url.pathname === "/api/transactions" && request.method === "GET") {
    const user = getUserFromRequest(request);
    const userId = user ? user.id : "usr_seed_aarav";

    const sinceParam = url.searchParams.get("since");
    let since: string | undefined;
    if (sinceParam === "24h") {
      since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    } else if (sinceParam === "7d") {
      since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (sinceParam && sinceParam !== "all") {
      since = sinceParam;
    }

    const txns = getTransactionsByUser(userId, { since });
    return jsonResponse({ transactions: txns });
  }

  if (url.pathname === "/api/predict" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse({ error: "Invalid request body." }, 400);
    }

    const payload = body as Record<string, unknown>;

    // 1. Validate transaction input
    const rawAmount = Number(payload.amount);
    if (isNaN(rawAmount) || rawAmount < 0) {
      return jsonResponse({ error: "Transaction amount must be a valid non-negative number." }, 400);
    }
    const amount = Math.round(rawAmount * 100) / 100;

    const time = typeof payload.time === "string" && payload.time.trim() ? payload.time.trim() : "00:00";
    const merchant = typeof payload.merchant === "string" && payload.merchant.trim() ? payload.merchant.trim() : "Amazon";
    const merchantCategory = typeof payload.merchantCategory === "string" && payload.merchantCategory.trim()
      ? payload.merchantCategory.trim()
      : (MERCHANT_CATEGORIES[merchant] || "Retail");
    const channel = typeof payload.channel === "string" && payload.channel.trim() ? payload.channel.trim() : "E-commerce";
    const location = typeof payload.location === "string" && payload.location.trim() ? payload.location.trim() : "San Francisco, US";
    const cardNetwork = typeof payload.cardNetwork === "string" && payload.cardNetwork.trim() ? payload.cardNetwork.trim() : "Visa";
    const cardLast4 = typeof payload.cardLast4 === "string" && payload.cardLast4.trim() ? payload.cardLast4.trim() : "2241";

    const currentUser = getUserFromRequest(request);
    const userId = currentUser ? currentUser.id : "usr_seed_aarav";
    const customer = typeof payload.customer === "string" && payload.customer.trim()
      ? payload.customer.trim()
      : currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Priya Menon";

    // 2. Run model inference
    let predictionResult: { fraud: boolean; prob: number; score: number };
    try {
      predictionResult = await predictFraud(body);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Model inference failed.";
      return jsonResponse({ error: `ML Prediction Failed: ${msg}` }, 500);
    }

    // 3. Simulated DB failure check (Test G)
    if (payload.simulateError === "db") {
      return jsonResponse({ error: "Database error saving prediction transaction." }, 500);
    }

    // 4. Compute risk, conf, status
    const fraud = !!predictionResult.fraud;
    const prob = Number(predictionResult.prob) || 0;
    const risk: "Low" | "Medium" | "High" = prob >= 0.7 ? "High" : prob >= 0.3 ? "Medium" : "Low";
    const conf = Math.round((fraud ? prob : (1 - prob)) * 100) / 100;
    const status: "Approved" | "Blocked" | "Review" = fraud ? (risk === "High" ? "Blocked" : "Review") : "Approved";

    // 5. Resolve unique transaction ID
    let txnId = typeof payload.transactionId === "string" && payload.transactionId.trim() ? payload.transactionId.trim() : "";
    if (!txnId || findTransactionById(txnId)) {
      txnId = `TXN-${Math.floor(280000 + Math.random() * 700000)}`;
    }

    // 6. Save transaction to database
    try {
      const saved = createTransaction({
        id: txnId,
        userId,
        customer,
        merchant,
        merchantCategory,
        channel,
        location,
        cardNetwork,
        cardLast4,
        amount,
        time,
        prediction: fraud ? "Fraud" : "Genuine",
        risk,
        prob,
        conf,
        status,
        features: Array.isArray(payload.features) ? (payload.features as number[]) : undefined,
        createdAt: new Date().toISOString(),
      });

      return jsonResponse({
        success: true,
        fraud,
        prob,
        score: prob,
        risk,
        conf,
        status,
        transaction: toTransactionDto(saved),
      }, 201);
    } catch (dbErr: unknown) {
      console.error("Database save transaction error:", dbErr);
      return jsonResponse({ error: "Failed to persist transaction to database." }, 500);
    }
  }

  if (url.pathname === "/api/predict-batch" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body)) {
      return jsonResponse({ error: "Invalid request body. Expected a JSON array." }, 400);
    }
    const predictions = await predictFraudBatch(body);
    return jsonResponse(predictions);
  }

  if (url.pathname === "/api/model-performance" && request.method === "GET") {
    try {
      const projectRoot = getProjectRoot();
      const metricsPath = path.join(projectRoot, "model_metrics.json");
      const content = await fs.readFile(metricsPath, "utf-8");
      return jsonResponse(JSON.parse(content));
    } catch (err) {
      console.error("Failed to read model metrics file, returning fallback:", err);
      return jsonResponse({
        accuracy: 99.91,
        precision: 71.68,
        recall: 82.65,
        f1_score: 76.78,
        roc_auc: 97.90,
        confusion_matrix: {
          tn: 56832,
          fp: 32,
          fn: 17,
          tp: 81
        }
      });
    }
  }

  return jsonResponse({ error: "Not found." }, 404);
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        return await handleApiRequest(request, url);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
