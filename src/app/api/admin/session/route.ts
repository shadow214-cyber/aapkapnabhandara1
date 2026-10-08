import {
  adminAuthIsConfigured,
  clearAdminSession,
  createAdminSession,
  getAdminSessionEmail,
  verifyAdminCredentials,
} from "@/lib/server/admin-auth";
import { isSameOriginRequest } from "@/lib/server/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const email = await getAdminSessionEmail();
  return Response.json({ authenticated: Boolean(email), email });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  if (!adminAuthIsConfigured()) return Response.json({ error: "Server admin credentials are not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid sign-in request." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("email" in body) || typeof body.email !== "string" || !("password" in body) || typeof body.password !== "string") {
    return Response.json({ error: "Enter your admin email and password." }, { status: 400 });
  }
  if (!await verifyAdminCredentials(body.email, body.password)) return Response.json({ error: "Admin email or password is incorrect." }, { status: 401 });
  await createAdminSession(body.email);
  return Response.json({ authenticated: true });
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  await clearAdminSession();
  return Response.json({ authenticated: false });
}
