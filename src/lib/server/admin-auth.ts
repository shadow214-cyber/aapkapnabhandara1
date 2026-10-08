import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isStoredAdminActive, verifyStoredAdmin } from "@/lib/server/admin-users";

const cookieName = "aab-admin-session";
const lifetimeSeconds = 8 * 60 * 60;

type SessionPayload = { email: string; expiresAt: number };

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

function safeEqual(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function adminAuthIsConfigured() {
  return Boolean(process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD && sessionSecret());
}

export async function verifyAdminCredentials(email: string, password: string) {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!sessionSecret()) return false;
  const normalizedEmail = email.trim().toLowerCase();
  if (configuredEmail && normalizedEmail === configuredEmail) {
    return Boolean(configuredPassword && safeEqual(password, configuredPassword));
  }
  return verifyStoredAdmin(normalizedEmail, password);
}

export async function createAdminSession(email: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Admin session secret is not configured.");
  const payload: SessionPayload = { email: email.trim().toLowerCase(), expiresAt: Date.now() + lifetimeSeconds * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${encoded}.${sign(encoded, secret)}`;
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    maxAge: lifetimeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getAdminSessionEmail(): Promise<string | null> {
  const secret = sessionSecret();
  const token = (await cookies()).get(cookieName)?.value;
  if (!secret || !token) return null;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const encoded = token.slice(0, separator);
  if (!safeEqual(token.slice(separator + 1), sign(encoded, secret))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof payload.email !== "string" || typeof payload.expiresAt !== "number" || payload.expiresAt <= Date.now()) return null;
    const primaryEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (payload.email === primaryEmail) return adminAuthIsConfigured() ? payload.email : null;
    return await isStoredAdminActive(payload.email) ? payload.email : null;
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  (await cookies()).delete(cookieName);
}
