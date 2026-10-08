"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AdminFrame } from "@/components/AdminFrame";
import { getCustomerProfiles, getPortalOrders, getServerCustomerProfilesSnapshot, getServerPortalOrdersSnapshot, subscribeToPortalData } from "@/lib/portal-data";

export default function AdminOverviewPage() {
  const orders = useSyncExternalStore(subscribeToPortalData, getPortalOrders, getServerPortalOrdersSnapshot);
  const customers = useSyncExternalStore(subscribeToPortalData, getCustomerProfiles, getServerCustomerProfilesSnapshot);
  const newCount = orders.filter((order) => order.status === "New").length;
  const confirmedCount = orders.filter((order) => order.status === "Confirmed").length;

  return (
    <AdminFrame title="Overview" active="/admin">
      <div className="admin-page-heading"><div><p className="admin-kicker">OPERATIONS <span>·</span> TODAY</p><h2>Good day, admin.</h2><p className="admin-intro">A clear view of your enquiries, customers, and menu.</p></div><Link className="admin-primary-button" href="/admin/requests">Review requests <span aria-hidden="true">↗</span></Link></div>
      <div className="admin-prototype-note" role="note"><strong>Preview workspace.</strong> Customer records, requests, and menu changes are saved only in this browser.</div>
      <div className="admin-stats"><article><span>ALL REQUESTS</span><strong>{orders.length.toString().padStart(2, "0")}</strong><small>Enquiries in this browser</small></article><article><span>NEW REQUESTS</span><strong>{newCount.toString().padStart(2, "0")}</strong><small>Need a first response</small></article><article><span>CONFIRMED</span><strong>{confirmedCount.toString().padStart(2, "0")}</strong><small>Marked confirmed</small></article><article><span>CUSTOMERS</span><strong>{customers.length.toString().padStart(2, "0")}</strong><small>Saved profiles</small></article></div>
      <div className="overview-columns">
        <section className="overview-panel"><div className="overview-panel-heading"><div><p className="admin-kicker">INBOX</p><h3>Recent requests</h3></div><Link href="/admin/requests">All requests ↗</Link></div>
          {orders.length ? <div className="overview-request-list">{orders.slice(0, 5).map((order) => <article key={order.id}><div className="overview-request-avatar">{order.name.charAt(0).toUpperCase()}</div><div className="overview-request-main"><strong>{order.name}</strong><span>{order.venue} · {order.guestCount.toLocaleString("en-IN")} guests</span></div><span className={`request-status status-${order.status.toLowerCase()}`}>{order.status}</span></article>)}</div> : <div className="overview-empty"><strong>Your inbox is clear.</strong><p>New customer enquiries will appear here.</p><Link href="/#booking">Preview the customer form ↗</Link></div>}
        </section>
        <section className="overview-panel overview-shortcuts"><p className="admin-kicker">QUICK ACCESS</p><h3>Manage the details.</h3><Link href="/admin/requests"><span className="shortcut-icon shortcut-orange">↗</span><span><strong>Event requests</strong><small>Track enquiries and update status</small></span><span>→</span></Link><Link href="/admin/menu"><span className="shortcut-icon shortcut-yellow">▦</span><span><strong>Menu & pricing</strong><small>Add, edit, or hide dishes</small></span><span>→</span></Link><Link href="/admin/customers"><span className="shortcut-icon shortcut-green">◉</span><span><strong>Customers</strong><small>Review saved customer profiles</small></span><span>→</span></Link><Link href="/admin/settings"><span className="shortcut-icon shortcut-red">⚙</span><span><strong>Admin setup</strong><small>Manage team directory and access notes</small></span><span>→</span></Link></section>
      </div>
    </AdminFrame>
  );
}
