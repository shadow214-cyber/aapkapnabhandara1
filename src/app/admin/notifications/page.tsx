"use client";

import { useEffect, useState } from "react";
import { AdminFrame } from "@/components/AdminFrame";

type ProviderStatus = { email: boolean; staffEmail: boolean; whatsapp: boolean };

function ProviderRow({ title, configured, detail }: { title: string; configured: boolean; detail: string }) {
  return <article className="provider-row"><span className={`provider-light${configured ? " provider-light-ready" : ""}`} /><div><strong>{title}</strong><p>{detail}</p></div><span className={`provider-state${configured ? " provider-state-ready" : ""}`}>{configured ? "CONFIGURED" : "SETUP REQUIRED"}</span></article>;
}

export default function AdminNotificationsPage() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/notification-settings").then(async (response) => {
      if (!response.ok) throw new Error("Could not read provider status.");
      return response.json() as Promise<ProviderStatus>;
    }).then((result) => { if (mounted) setStatus(result); }).catch(() => { if (mounted) setError("Could not read provider status. Sign in again and refresh this page."); });
    return () => { mounted = false; };
  }, []);

  return (
    <AdminFrame title="Message delivery" active="/admin/notifications">
      <div className="admin-page-heading"><div><p className="admin-kicker">CUSTOMER UPDATES <span>·</span> DELIVERY</p><h2>Email & WhatsApp</h2><p className="admin-intro">New enquiries trigger an email attempt. WhatsApp is only attempted when a customer opted in and an approved template is configured.</p></div></div>
      {error && <p className="admin-inline-notice" role="alert">{error}</p>}
      <div className="provider-list">{status ? <><ProviderRow title="Customer email · Resend" configured={status.email} detail="Sends an enquiry acknowledgement to the customer." /><ProviderRow title="Admin email" configured={status.staffEmail} detail="Copies new enquiry details to the configured operations inbox." /><ProviderRow title="WhatsApp Cloud API" configured={status.whatsapp} detail="Uses the approved template for opted-in customer updates." /></> : <p className="portal-loading">Checking provider configuration…</p>}</div>
      <section className="provider-setup"><p className="admin-kicker">PRIVATE SERVER SETTINGS</p><h3>Configure credentials</h3><p>Add these variables to the private `.env.local` file and restart the server. Credentials are never shown on this page or stored in browser storage.</p><div className="provider-setup-grid"><div><strong>Email</strong><code>RESEND_API_KEY</code><code>NOTIFICATION_FROM_EMAIL</code><code>ADMIN_NOTIFICATION_EMAIL</code></div><div><strong>WhatsApp</strong><code>WHATSAPP_ACCESS_TOKEN</code><code>WHATSAPP_PHONE_NUMBER_ID</code><code>WHATSAPP_TEMPLATE_NAME</code><code>WHATSAPP_TEMPLATE_LANGUAGE</code><code>WHATSAPP_GRAPH_VERSION</code></div></div><p>Resend requires an authorized sender domain. WhatsApp requires a business phone number and an approved template whose body has four text variables: customer name, request reference, request status, and event date/venue. Customers must opt in before WhatsApp updates are sent.</p><p className="provider-caveat">A provider’s accepted response is not proof that a message reached the inbox or phone. Delivery and failures need monitoring before launch.</p></section>
    </AdminFrame>
  );
}
