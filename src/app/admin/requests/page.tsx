"use client";

import { useState, useSyncExternalStore } from "react";
import { AdminFrame } from "@/components/AdminFrame";
import { deletePortalOrder, getPortalOrders, getServerPortalOrdersSnapshot, setPortalOrderStatus, subscribeToPortalData, type PortalOrder, type PortalStatus } from "@/lib/portal-data";

const statuses: PortalStatus[] = ["New", "Contacted", "Confirmed", "Completed", "Cancelled"];
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function AdminRequestsPage() {
  const orders = useSyncExternalStore(subscribeToPortalData, getPortalOrders, getServerPortalOrdersSnapshot);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const visible = orders.filter((order) => (filter === "All" || order.status === filter) && `${order.name} ${order.email} ${order.phone} ${order.venue} ${order.area}`.toLowerCase().includes(query.toLowerCase()));

  async function changeStatus(order: PortalOrder, status: PortalStatus) {
    setPortalOrderStatus(order.id, status);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...order, status }),
      });
      const result = await response.json() as { email?: string; whatsapp?: string; error?: string };
      setNotice(response.ok ? `Progress saved. Email: ${result.email ?? "not sent"}; WhatsApp: ${result.whatsapp ?? "not sent"}.` : `Progress saved locally. ${result.error ?? "No notification was sent."}`);
    } catch {
      setNotice("Progress saved locally. Notification service could not be reached.");
    }
  }

  function removeRequest(order: PortalOrder) {
    if (window.confirm(`Delete the request from ${order.name} for ${order.venue}? This cannot be undone in this browser.`)) deletePortalOrder(order.id);
  }

  return (
    <AdminFrame title="Event requests" active="/admin/requests">
      <div className="admin-page-heading"><div><p className="admin-kicker">CUSTOMER ENQUIRIES <span>·</span> {orders.length} TOTAL</p><h2>Request inbox</h2><p className="admin-intro">Review event details, follow up, and keep each customer up to date.</p></div></div>
      {notice && <p className="admin-inline-notice" role="status">{notice}</p>}
      <div className="admin-table-tools"><label className="admin-search">Search requests<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, venue, area" /></label><label className="admin-filter">Status<select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label></div>
      {visible.length ? <div className="admin-request-list">{visible.map((order) => <article className="admin-request-card" key={order.id}><div className="admin-request-heading"><div><p className="admin-kicker">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} <span>·</span> {order.id.slice(0, 8).toUpperCase()}</p><h3>{order.name}</h3></div><span className={`request-status status-${order.status.toLowerCase()}`}>{order.status}</span></div><div className="admin-request-details"><div><span>CONTACT</span><strong>{order.email}</strong><strong>{order.phone}</strong></div><div><span>EVENT</span><strong>{order.venue}</strong><strong>{order.area} · {new Date(`${order.date}T12:00:00`).toLocaleDateString("en-IN")} · {order.guestCount.toLocaleString("en-IN")} guests</strong></div><div><span>MENU & ESTIMATE</span><strong>{order.dishes.join(", ") || "Menu to be discussed"}</strong><strong>{money.format(order.estimate)} estimate</strong></div></div>{order.message && <p className="admin-request-message">“{order.message}”</p>}<div className="admin-request-actions"><label>Progress<select value={order.status} onChange={(event) => changeStatus(order, event.target.value as PortalStatus)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><button type="button" className="admin-danger-button" onClick={() => removeRequest(order)}>Delete request</button></div></article>)}</div> : <div className="portal-empty"><strong>{orders.length ? "No matching requests" : "The inbox is clear"}</strong><p>{orders.length ? "Try a different search or status filter." : "Customer enquiries will appear here after submission in this browser."}</p></div>}
    </AdminFrame>
  );
}
