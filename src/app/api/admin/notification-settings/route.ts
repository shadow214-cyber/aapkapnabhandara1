import { getAdminSessionEmail } from "@/lib/server/admin-auth";
import { notificationConfiguration } from "@/lib/server/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!await getAdminSessionEmail()) return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  return Response.json(notificationConfiguration());
}
