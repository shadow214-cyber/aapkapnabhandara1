import "server-only";

export type NotificationOrder = {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  area: string;
  venue: string;
  guestCount: number;
  status?: string;
  whatsappOptIn: boolean;
};

export type NotificationResults = { email: string; whatsapp: string };

export function notificationConfiguration() {
  return {
    email: Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL),
    staffEmail: Boolean(process.env.ADMIN_NOTIFICATION_EMAIL),
    whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TEMPLATE_NAME),
  };
}

async function sendEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from) return "not_configured";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
      cache: "no-store",
    });
    return response.ok ? "accepted" : "failed";
  } catch {
    return "failed";
  }
}

function normalizeWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return null;
}

async function sendWhatsApp(order: NotificationOrder) {
  if (!order.whatsappOptIn) return "not_opted_in";
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const recipient = normalizeWhatsAppNumber(order.phone);
  if (!token || !phoneNumberId || !templateName) return "not_configured";
  if (!recipient) return "invalid_number";

  const version = process.env.WHATSAPP_GRAPH_VERSION || "v22.0";
  const status = order.status || "New";
  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en" },
          components: [{ type: "body", parameters: [
            { type: "text", text: order.name.slice(0, 80) },
            { type: "text", text: order.id.slice(0, 20) },
            { type: "text", text: status.slice(0, 30) },
            { type: "text", text: `${order.date} · ${order.venue}`.slice(0, 140) },
          ] }],
        },
      }),
      cache: "no-store",
    });
    return response.ok ? "accepted" : "failed";
  } catch {
    return "failed";
  }
}

export async function sendBookingNotice(order: NotificationOrder): Promise<NotificationResults> {
  const eventDate = order.date;
  const details = `${order.name} submitted a bhandara enquiry.\nRequest: ${order.id}\nEvent: ${eventDate} at ${order.venue}, ${order.area}\nGuests: ${order.guestCount}\nContact: ${order.email} · ${order.phone}`;
  const emailResults = await Promise.all([
    sendEmail(order.email, "We received your event enquiry", `Hello ${order.name},\n\nWe have received your event enquiry for ${eventDate}. Our team will review the details and contact you.\n\nRequest reference: ${order.id}\nVenue: ${order.venue}, ${order.area}\nGuests: ${order.guestCount}\n\nAapka Apna Bhandara`),
    process.env.ADMIN_NOTIFICATION_EMAIL ? sendEmail(process.env.ADMIN_NOTIFICATION_EMAIL, "New bhandara event enquiry", details) : Promise.resolve("not_configured"),
  ]);
  return { email: emailResults[0] === "accepted" ? (emailResults[1] === "accepted" ? "accepted" : "customer_accepted") : emailResults[0], whatsapp: await sendWhatsApp(order) };
}

export async function sendStatusNotice(order: NotificationOrder): Promise<NotificationResults> {
  const status = order.status || "Updated";
  const text = `Hello ${order.name},\n\nThe progress on your event enquiry (${order.id}) is now: ${status}.\nEvent: ${order.date} at ${order.venue}, ${order.area}.\n\nAapka Apna Bhandara`;
  return {
    email: await sendEmail(order.email, `Your event enquiry is ${status.toLowerCase()}`, text),
    whatsapp: await sendWhatsApp(order),
  };
}
