type StoredCredential = { email: string; salt: string; hash: string };

const credentialsKey = "aapb.customer-credentials.v1";

function readCredentials(): StoredCredential[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(credentialsKey) ?? "[]");
    return Array.isArray(parsed) ? parsed as StoredCredential[] : [];
  } catch {
    return [];
  }
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string) {
  const bytes = Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function hashPassword(password: string, salt: ArrayBuffer) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" }, key, 256);
  return toHex(new Uint8Array(bits));
}

export async function saveCustomerCredential(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const salt = new ArrayBuffer(16);
  crypto.getRandomValues(new Uint8Array(salt));
  const credentials = readCredentials().filter((item) => item.email !== normalizedEmail);
  credentials.push({ email: normalizedEmail, salt: toHex(new Uint8Array(salt)), hash: await hashPassword(password, salt) });
  window.localStorage.setItem(credentialsKey, JSON.stringify(credentials));
}

export async function verifyCustomerCredential(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = readCredentials().find((item) => item.email === normalizedEmail);
  if (!credential) return false;
  return (await hashPassword(password, fromHex(credential.salt))) === credential.hash;
}
