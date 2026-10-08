import { getAdminSessionEmail } from "@/lib/server/admin-auth";
import { sendStatusNotice, type NotificationOrder } from "@/lib/server/notifications";
import { isSameOriginRequest } from "@/lib/server/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isNotificationOrder(value: unknown): value is NotificationOrder {
  if (typeof value !== "object" || value === null) return false;
  const order = value as Partial<NotificationOrder>;
  return typeof order.id === "string" && typeof order.name === "string" && typeof order.email === "string" &&
    typeof order.phone === "string" && typeof order.date === "string" && typeof order.area === "string" &&
    typeof order.venue === "string" && typeof order.guestCount === "number" && typeof order.status === "string" &&
    typeof order.whatsappOptIn === "boolean";
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  if (!await getAdminSessionEmail()) return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid notification request." }, { status: 400 });
  }
  if (!isNotificationOrder(body)) return Response.json({ error: "Invalid request details." }, { status: 400 });
  return Response.json(await sendStatusNotice(body));
}
