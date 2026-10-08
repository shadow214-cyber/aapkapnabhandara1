import { getAdminSessionEmail } from "@/lib/server/admin-auth";
import { createAdminUser, deleteAdminUser, listAdminsForSettings, updateAdminUser } from "@/lib/server/admin-users";
import { isSameOriginRequest } from "@/lib/server/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET() {
  if (!await getAdminSessionEmail()) return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  try {
    return Response.json({ admins: await listAdminsForSettings() });
  } catch {
    return Response.json({ error: "Admin account storage could not be read." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  if (!await getAdminSessionEmail()) return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  const body = await readBody(request);
  if (typeof body !== "object" || body === null || !("name" in body) || typeof body.name !== "string" || !("email" in body) || typeof body.email !== "string" || !("password" in body) || typeof body.password !== "string" || !("phone" in body) || typeof body.phone !== "string") {
    return Response.json({ error: "Enter the admin name, email, phone, and password." }, { status: 400 });
  }
  if (!body.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.password.length < 12 || body.phone.length > 30) {
    return Response.json({ error: "Use a valid email and a password with at least 12 characters." }, { status: 400 });
  }
  const input = body as { name: string; email: string; phone: string; password: string };
  try {
    return Response.json({ admin: await createAdminUser(input) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not create admin." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const sessionEmail = await getAdminSessionEmail();
  if (!sessionEmail) return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  const body = await readBody(request);
  if (!isRecord(body) || typeof body.id !== "string" || typeof body.name !== "string" || typeof body.email !== "string" || typeof body.phone !== "string" || typeof body.active !== "boolean" || (body.password !== undefined && typeof body.password !== "string")) {
    return Response.json({ error: "Invalid admin update." }, { status: 400 });
  }
  const password = typeof body.password === "string" ? body.password : undefined;
  if (body.id === "environment-primary") return Response.json({ error: "Update the primary admin through private environment settings." }, { status: 400 });
  if (!body.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.phone.length > 30 || (password && password.length < 12)) {
    return Response.json({ error: "Use a valid email and, if resetting, a password with at least 12 characters." }, { status: 400 });
  }
  const input: { id: string; name: string; email: string; phone: string; active: boolean; password?: string } = { id: body.id, name: body.name, email: body.email, phone: body.phone, active: body.active, password };
  const currentAdmin = (await listAdminsForSettings()).find((admin) => admin.id === input.id);
  if (currentAdmin?.email === sessionEmail && (currentAdmin.email !== input.email.trim().toLowerCase() || !input.active)) {
    return Response.json({ error: "You cannot change or disable the admin login you are currently using." }, { status: 400 });
  }
  try {
    return Response.json({ admin: await updateAdminUser(input) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not update admin." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const sessionEmail = await getAdminSessionEmail();
  if (!sessionEmail) return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  const body = await readBody(request);
  if (typeof body !== "object" || body === null || !("id" in body) || typeof body.id !== "string") return Response.json({ error: "Invalid admin removal request." }, { status: 400 });
  if (body.id === "environment-primary") return Response.json({ error: "The primary admin is configured through private environment settings." }, { status: 400 });
  try {
    const admins = await listAdminsForSettings();
    const target = admins.find((admin) => admin.id === body.id);
    if (target?.email === sessionEmail) return Response.json({ error: "You cannot remove the admin account you are using." }, { status: 400 });
    await deleteAdminUser(body.id);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not remove admin." }, { status: 400 });
  }
}
