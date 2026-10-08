import { sendBookingNotice, type NotificationOrder } from "@/lib/server/notifications";
import { isSameOriginRequest } from "@/lib/server/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const attempts = new Map<string, number[]>();
const windowMs = 10 * 60 * 1000;
const maxAttempts = 3;

function withinRateLimit(request: Request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  if (!attempts.has(address) && attempts.size >= 5000) {
    for (const [key, times] of attempts) {
      const activeTimes = times.filter((time) => now - time < windowMs);
      if (activeTimes.length) attempts.set(key, activeTimes);
      else attempts.delete(key);
    }
    if (attempts.size >= 5000) return false;
  }
  const recent = (attempts.get(address) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= maxAttempts) return false;
  attempts.set(address, [...recent, now]);
  return true;
}

function isOrder(value: unknown): value is NotificationOrder & { contactConsent: boolean } {
  if (typeof value !== "object" || value === null) return false;
  const order = value as Partial<NotificationOrder> & { contactConsent?: unknown };
  return typeof order.id === "string" && order.id.length <= 80 &&
    typeof order.name === "string" && order.name.trim().length > 0 && order.name.length <= 80 &&
    typeof order.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email) &&
    typeof order.phone === "string" && order.phone.length <= 30 &&
    typeof order.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(order.date) &&
    typeof order.area === "string" && order.area.length <= 80 &&
    typeof order.venue === "string" && order.venue.trim().length > 0 && order.venue.length <= 180 &&
    typeof order.guestCount === "number" && Number.isInteger(order.guestCount) && order.guestCount >= 1 && order.guestCount <= 10000 &&
    typeof order.whatsappOptIn === "boolean" && order.contactConsent === true;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  if (!withinRateLimit(request)) return Response.json({ error: "Too many notification requests. Try again shortly." }, { status: 429 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid notification request." }, { status: 400 });
  }
  if (!isOrder(body)) return Response.json({ error: "The event details or contact consent are invalid." }, { status: 400 });
  return Response.json(await sendBookingNotice(body));
}
