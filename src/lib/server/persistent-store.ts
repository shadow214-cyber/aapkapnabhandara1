import "server-only";

import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const blobStoreName = "aab-data";
const dataDirectory = join(process.cwd(), ".data");

function useNetlifyBlobs() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_DEV || process.env.NETLIFY_BLOBS_CONTEXT);
}

function blobStore() {
  return getStore({ name: blobStoreName, consistency: "strong" });
}

function isMissingFile(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

async function readFileBytes(relativePath: string) {
  try {
    return await readFile(join(dataDirectory, relativePath));
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
}

async function writeFileBytes(relativePath: string, value: Buffer) {
  const filePath = join(dataDirectory, relativePath);
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(temporaryPath, value, { flag: "wx" });
  await rename(temporaryPath, filePath);
}

export async function readJsonRecord<T>(key: string): Promise<T | null> {
  if (useNetlifyBlobs()) {
    const value = await blobStore().get(key, { type: "json" });
    return (value ?? null) as T | null;
  }
  const bytes = await readFileBytes(key);
  if (!bytes) return null;
  return JSON.parse(bytes.toString("utf8")) as T;
}

export async function writeJsonRecord(key: string, value: unknown) {
  if (useNetlifyBlobs()) {
    await blobStore().setJSON(key, value);
    return;
  }
  await writeFileBytes(key, Buffer.from(JSON.stringify(value, null, 2), "utf8"));
}

export async function readBinaryRecord(key: string) {
  if (useNetlifyBlobs()) {
    const value = await blobStore().get(key, { type: "arrayBuffer" });
    return value ? Buffer.from(value) : null;
  }
  return readFileBytes(key);
}

export async function writeBinaryRecord(key: string, value: Buffer) {
  if (useNetlifyBlobs()) {
    const copy = new ArrayBuffer(value.byteLength);
    new Uint8Array(copy).set(value);
    await blobStore().set(key, copy);
    return;
  }
  await writeFileBytes(key, value);
}
