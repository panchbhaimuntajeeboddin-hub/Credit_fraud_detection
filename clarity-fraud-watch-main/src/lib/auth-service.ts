import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { findUserByEmail, findUserById, createUser, toUserDto, type UserDto } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "sentinel_fraud_watch_secret_key_2026_secure";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthTokenPayload = {
  userId: string;
  email: string;
};

export function validateRegistrationInput(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request payload." };
  }
  const payload = body as Record<string, unknown>;
  const { firstName, lastName, email, company, password } = payload;

  if (typeof firstName !== "string" || !firstName.trim()) {
    return { valid: false, error: "First name is required." };
  }
  if (typeof lastName !== "string" || !lastName.trim()) {
    return { valid: false, error: "Last name is required." };
  }
  if (typeof email !== "string" || !email.trim()) {
    return { valid: false, error: "Work email is required." };
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: "Please enter a valid work email address." };
  }
  if (typeof company !== "string" || !company.trim()) {
    return { valid: false, error: "Company name is required." };
  }
  if (typeof password !== "string" || !password) {
    return { valid: false, error: "Password is required." };
  }
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  return { valid: true };
}

export function generateToken(user: { id: string; email: string }): string {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function registerUser(body: unknown): {
  success: boolean;
  status: number;
  error?: string;
  token?: string;
  user?: UserDto;
} {
  const validation = validateRegistrationInput(body);
  if (!validation.valid) {
    return { success: false, status: 400, error: validation.error };
  }

  const payload = body as Record<string, string>;
  const { firstName, lastName, email, company, password, role } = payload;
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already registered
  const existing = findUserByEmail(normalizedEmail);
  if (existing) {
    return {
      success: false,
      status: 409,
      error: "An account with this email already exists. Please log in.",
    };
  }

  // Hash password securely (never store plain text)
  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = `usr_${crypto.randomUUID()}`;

  try {
    const record = createUser({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim(),
      role: role || "Risk Analyst",
    });

    const userDto = toUserDto(record);
    const token = generateToken(record);

    return {
      success: true,
      status: 201,
      token,
      user: userDto,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("UNIQUE")) {
      return {
        success: false,
        status: 409,
        error: "An account with this email already exists. Please log in.",
      };
    }
    return {
      success: false,
      status: 500,
      error: "Failed to create user account. Please try again.",
    };
  }
}

export function loginUser(body: unknown): {
  success: boolean;
  status: number;
  error?: string;
  token?: string;
  user?: UserDto;
} {
  if (!body || typeof body !== "object") {
    return { success: false, status: 400, error: "Invalid request payload." };
  }
  const payload = body as Record<string, unknown>;
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!email || !password) {
    return { success: false, status: 400, error: "Email and password are required." };
  }

  const normalizedEmail = email.toLowerCase();
  const record = findUserByEmail(normalizedEmail);
  if (!record) {
    return { success: false, status: 401, error: "Invalid email or password." };
  }

  const matches = bcrypt.compareSync(password, record.password_hash);
  if (!matches) {
    return { success: false, status: 401, error: "Invalid email or password." };
  }

  const userDto = toUserDto(record);
  const token = generateToken(record);

  return {
    success: true,
    status: 200,
    token,
    user: userDto,
  };
}

export function getUserFromRequest(request: Request): UserDto | null {
  const authHeader = request.headers.get("authorization") || "";
  let token = "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/sentinel_token=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;

  const record = findUserById(payload.userId);
  if (!record) return null;

  return toUserDto(record);
}
