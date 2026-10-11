import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

export type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  company: string;
  role: string;
  created_at: string;
};

export type UserDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  createdAt: string;
};

export type TransactionRecord = {
  id: string;
  user_id: string;
  customer: string;
  merchant: string;
  merchant_category: string;
  channel: string;
  location: string;
  card_network: string;
  card_last4: string;
  amount: number;
  time: string;
  created_at: string;
  prediction: "Genuine" | "Fraud";
  risk: "Low" | "Medium" | "High";
  prob: number;
  conf: number;
  status: "Approved" | "Blocked" | "Review";
  features?: string;
};

export type TransactionDto = {
  id: string;
  userId: string;
  customer: string;
  merchant: string;
  merchantCategory: string;
  channel: string;
  location: string;
  cardNetwork: string;
  cardLast4: string;
  amount: number;
  time: string;
  createdAt: string;
  prediction: "Genuine" | "Fraud";
  risk: "Low" | "Medium" | "High";
  prob: number;
  conf: number;
  status: "Approved" | "Blocked" | "Review";
};

const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "sentinel.db");
const db = new DatabaseSync(dbPath);

// Create users table with database-level UNIQUE constraint on normalized email
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Risk Analyst',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

// Create transactions table with database-level persistence
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    customer TEXT NOT NULL,
    merchant TEXT NOT NULL,
    merchant_category TEXT NOT NULL,
    channel TEXT NOT NULL,
    location TEXT NOT NULL,
    card_network TEXT NOT NULL,
    card_last4 TEXT NOT NULL,
    amount REAL NOT NULL,
    time TEXT NOT NULL,
    created_at TEXT NOT NULL,
    prediction TEXT NOT NULL,
    risk TEXT NOT NULL,
    prob REAL NOT NULL,
    conf REAL NOT NULL,
    status TEXT NOT NULL,
    features TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
`);

// User prepared statements
const selectEmailStmt = db.prepare(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`);
const selectIdStmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
const insertUserStmt = db.prepare(`
  INSERT INTO users (id, email, password_hash, first_name, last_name, company, role, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Transaction prepared statements
const selectTxnByIdStmt = db.prepare(`SELECT * FROM transactions WHERE id = ?`);
const selectTxnsByUserStmt = db.prepare(`
  SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC
`);
const selectTxnsByUserAndDateStmt = db.prepare(`
  SELECT * FROM transactions WHERE user_id = ? AND created_at >= ? ORDER BY created_at DESC
`);
const countTxnsByUserStmt = db.prepare(`
  SELECT COUNT(*) as count FROM transactions WHERE user_id = ?
`);
const insertTxnStmt = db.prepare(`
  INSERT INTO transactions (
    id, user_id, customer, merchant, merchant_category,
    channel, location, card_network, card_last4, amount,
    time, created_at, prediction, risk, prob, conf, status, features
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Seed default users if they don't already exist
const defaultSeeds = [
  {
    id: "usr_seed_aarav",
    email: "aarav@northbank.io",
    firstName: "Aarav",
    lastName: "Kapoor",
    company: "Northbank",
    role: "Risk Analyst",
    password: "Password123!",
  },
  {
    id: "usr_seed_analyst",
    email: "analyst@northbank.io",
    firstName: "Priya",
    lastName: "Menon",
    company: "Northbank",
    role: "Head of Risk",
    password: "Password123!",
  },
];

for (const seed of defaultSeeds) {
  const existing = selectEmailStmt.get(seed.email) as UserRecord | undefined;
  if (!existing) {
    const hash = bcrypt.hashSync(seed.password, 10);
    insertUserStmt.run(
      seed.id,
      seed.email.toLowerCase().trim(),
      hash,
      seed.firstName,
      seed.lastName,
      seed.company,
      seed.role,
      new Date().toISOString(),
    );
  }
}

// Seed baseline transactions for usr_seed_aarav if no transactions exist yet
const aaravTxnCount = (countTxnsByUserStmt.get("usr_seed_aarav") as { count: number } | undefined)?.count ?? 0;
if (aaravTxnCount === 0) {
  const merchants = ["Amazon", "FastMart", "Uber", "Starbucks", "Apple", "Netflix", "Shell", "IKEA", "Zara", "Steam"];
  const categories: Record<string, string> = {
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
  const channels = ["E-commerce", "In-store", "Mobile app", "Contactless"];
  const networks = ["Visa", "Mastercard", "Amex", "Discover"];
  const locations = ["San Francisco, US", "New York, US", "London, UK", "Berlin, DE", "Toronto, CA", "Bengaluru, IN"];
  const customers = ["A. Kapoor", "P. Menon", "D. Cruz", "S. Iyer", "M. Rao", "L. Khan", "K. Singh", "R. Bose"];

  const now = Date.now();
  for (let i = 0; i < 24; i++) {
    const risk = i % 4 === 3 ? "High" : i % 4 === 2 ? "Medium" : "Low";
    const prediction: "Genuine" | "Fraud" = risk === "High" ? "Fraud" : "Genuine";
    const status: "Approved" | "Blocked" | "Review" = prediction === "Fraud" ? (risk === "High" ? "Blocked" : "Review") : "Approved";
    const merchant = merchants[i % merchants.length];
    const amount = Math.round((Math.random() * 850 + 12) * 100) / 100;
    // Spread evenly across the last 18 hours
    const txnTimeMs = now - i * 45 * 60 * 1000;
    const createdAt = new Date(txnTimeMs).toISOString();
    const timeStr = createdAt.slice(11, 16);
    const prob = prediction === "Fraud" ? 0.88 : 0.04;
    const conf = prediction === "Fraud" ? 0.91 : 0.96;

    insertTxnStmt.run(
      `TXN-${284100 + i}`,
      "usr_seed_aarav",
      customers[i % customers.length],
      merchant,
      categories[merchant] || "Retail",
      channels[i % channels.length],
      locations[i % locations.length],
      networks[i % networks.length],
      (1000 + ((284100 + i) % 9000)).toString(),
      amount,
      timeStr,
      createdAt,
      prediction,
      risk,
      prob,
      conf,
      status,
      null,
    );
  }
}

export function toUserDto(record: UserRecord): UserDto {
  return {
    id: record.id,
    email: record.email,
    firstName: record.first_name,
    lastName: record.last_name,
    company: record.company,
    role: record.role,
    createdAt: record.created_at,
  };
}

export function toTransactionDto(record: TransactionRecord): TransactionDto {
  return {
    id: record.id,
    userId: record.user_id,
    customer: record.customer,
    merchant: record.merchant,
    merchantCategory: record.merchant_category,
    channel: record.channel,
    location: record.location,
    cardNetwork: record.card_network,
    cardLast4: record.card_last4,
    amount: record.amount,
    time: record.time,
    createdAt: record.created_at,
    prediction: record.prediction,
    risk: record.risk,
    prob: record.prob,
    conf: record.conf,
    status: record.status,
  };
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const normalized = email.trim().toLowerCase();
  return selectEmailStmt.get(normalized) as UserRecord | undefined;
}

export function findUserById(id: string): UserRecord | undefined {
  return selectIdStmt.get(id) as UserRecord | undefined;
}

export function createUser(data: {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  company: string;
  role?: string;
}): UserRecord {
  const normalizedEmail = data.email.trim().toLowerCase();
  const role = data.role || "Risk Analyst";
  const now = new Date().toISOString();

  insertUserStmt.run(
    data.id,
    normalizedEmail,
    data.passwordHash,
    data.firstName.trim(),
    data.lastName.trim(),
    data.company.trim(),
    role,
    now,
  );

  const created = findUserById(data.id);
  if (!created) {
    throw new Error("Failed to retrieve created user record.");
  }
  return created;
}

export function findTransactionById(id: string): TransactionRecord | undefined {
  return selectTxnByIdStmt.get(id) as TransactionRecord | undefined;
}

export function getTransactionsByUser(userId: string, options?: { since?: string; limit?: number }): TransactionDto[] {
  let rows: TransactionRecord[];
  if (options?.since) {
    rows = selectTxnsByUserAndDateStmt.all(userId, options.since) as TransactionRecord[];
  } else {
    rows = selectTxnsByUserStmt.all(userId) as TransactionRecord[];
  }
  if (options?.limit && options.limit > 0) {
    rows = rows.slice(0, options.limit);
  }
  return rows.map(toTransactionDto);
}

export function createTransaction(data: {
  id: string;
  userId: string;
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
  prob: number;
  conf: number;
  status: "Approved" | "Blocked" | "Review";
  features?: number[] | string;
  createdAt?: string;
}): TransactionRecord {
  const createdAt = data.createdAt || new Date().toISOString();
  const featuresStr = Array.isArray(data.features) ? JSON.stringify(data.features) : (data.features ?? null);

  insertTxnStmt.run(
    data.id,
    data.userId,
    data.customer.trim(),
    data.merchant.trim(),
    data.merchantCategory.trim(),
    data.channel.trim(),
    data.location.trim(),
    data.cardNetwork.trim(),
    data.cardLast4.trim(),
    data.amount,
    data.time.trim(),
    createdAt,
    data.prediction,
    data.risk,
    data.prob,
    data.conf,
    data.status,
    featuresStr,
  );

  const record = findTransactionById(data.id);
  if (!record) {
    throw new Error(`Failed to retrieve inserted transaction record ${data.id}`);
  }
  return record;
}
