import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { readJsonRecord, writeJsonRecord } from "@/lib/server/persistent-store";

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
};

export type AdminUserView = Omit<AdminUserRecord, "passwordSalt" | "passwordHash"> & { source: "environment" | "server-store" };

const usersKey = "admin-users.json";

async function readUsers(): Promise<AdminUserRecord[]> {
  const parsed = await readJsonRecord<unknown>(usersKey);
  if (parsed == null) return [];
  if (!Array.isArray(parsed)) throw new Error("Admin user store has an invalid format.");
  return parsed as AdminUserRecord[];
}

async function writeUsers(users: AdminUserRecord[]) {
  await writeJsonRecord(usersKey, users);
}

function passwordHash(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function equalHash(left: string, right: string) {
  const leftBytes = Buffer.from(left, "hex");
  const rightBytes = Buffer.from(right, "hex");
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function toAdminUserView(user: AdminUserRecord): AdminUserView {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, active: user.active, createdAt: user.createdAt, source: "server-store" };
}

export async function findAdminUser(email: string) {
  const normalized = email.trim().toLowerCase();
  return (await readUsers()).find((user) => user.email === normalized);
}

export async function verifyStoredAdmin(email: string, password: string) {
  const user = await findAdminUser(email);
  if (!user?.active) return false;
  return equalHash(passwordHash(password, user.passwordSalt), user.passwordHash);
}

export async function isStoredAdminActive(email: string) {
  const user = await findAdminUser(email);
  return Boolean(user?.active);
}

export async function listAdminUsers(): Promise<AdminUserView[]> {
  return (await readUsers()).map(toAdminUserView);
}

export async function createAdminUser(input: { name: string; email: string; phone: string; password: string }) {
  const users = await readUsers();
  const email = input.email.trim().toLowerCase();
  if (users.some((user) => user.email === email) || email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) throw new Error("An admin with this email already exists.");
  const salt = randomBytes(16).toString("hex");
  const user: AdminUserRecord = {
    id: randomBytes(16).toString("hex"),
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    active: true,
    passwordSalt: salt,
    passwordHash: passwordHash(input.password, salt),
    createdAt: new Date().toISOString(),
  };
  await writeUsers([...users, user]);
  return toAdminUserView(user);
}

export async function updateAdminUser(input: { id: string; name: string; email: string; phone: string; active: boolean; password?: string }) {
  const users = await readUsers();
  const target = users.find((user) => user.id === input.id);
  if (!target) throw new Error("Admin account not found.");
  const email = input.email.trim().toLowerCase();
  if (users.some((user) => user.id !== input.id && user.email === email) || email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) throw new Error("An admin with this email already exists.");
  if (target.active && !input.active && users.filter((user) => user.active).length === 1 && !process.env.ADMIN_EMAIL?.trim()) throw new Error("The last active admin cannot be disabled.");
  const updated: AdminUserRecord = {
    ...target,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    active: input.active,
  };
  if (input.password) {
    const salt = randomBytes(16).toString("hex");
    updated.passwordSalt = salt;
    updated.passwordHash = passwordHash(input.password, salt);
  }
  await writeUsers(users.map((user) => user.id === input.id ? updated : user));
  return toAdminUserView(updated);
}

export async function deleteAdminUser(id: string) {
  const users = await readUsers();
  const target = users.find((user) => user.id === id);
  if (!target) throw new Error("Admin account not found.");
  if (target.active && users.filter((user) => user.active).length === 1 && !process.env.ADMIN_EMAIL?.trim()) throw new Error("The last active admin cannot be deleted.");
  await writeUsers(users.filter((user) => user.id !== id));
}

export async function listAdminsForSettings(): Promise<AdminUserView[]> {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const environmentAdmin: AdminUserView[] = configuredEmail ? [{
    id: "environment-primary",
    name: process.env.ADMIN_NAME?.trim() || "Primary admin",
    email: configuredEmail,
    phone: process.env.ADMIN_PHONE?.trim() || "",
    active: true,
    createdAt: "",
    source: "environment",
  }] : [];
  return [...environmentAdmin, ...await listAdminUsers()];
}
