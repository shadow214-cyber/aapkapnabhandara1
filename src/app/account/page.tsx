"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearCustomerSession, getCustomerSession, getPortalOrders, saveCustomerProfile, subscribeToPortalData, type CustomerProfile, type PortalOrder } from "@/lib/portal-data";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<PortalOrder[]>([]);

  useEffect(() => {
    const refresh = () => {
      setProfile(getCustomerSession());
      setOrders(getPortalOrders());
    };
    refresh();
    return subscribeToPortalData(refresh);
  }, []);

  const myOrders = profile ? orders.filter((order) => order.email.toLowerCase() === profile.email.toLowerCase()) : [];
  const upcoming = myOrders.filter((order) => order.date >= new Date().toISOString().slice(0, 10) && !["Completed", "Cancelled"].includes(order.status));

  function signOut() {
    clearCustomerSession();
    router.push("/");
  }

  return (
    <main className="portal-page">
      <header className="portal-header">
        <Link className="brand" href="/"><span className="pot-mark" aria-hidden="true"><span>U</span></span><span>Aapka Apna<br />Bhandara</span></Link>
        <div className="portal-header-actions"><Link href="/">Customer site ↗</Link>{profile && <button type="button" onClick={signOut}>Sign out</button>}</div>
      </header>
      <section className="portal-content">
        {!profile ? <div className="portal-gate"><p className="eyebrow"><span />CUSTOMER ACCOUNT</p><h1>Your gatherings,<br />all in one place.</h1><p>Sign in to track your event enquiries and revisit previous orders.</p><Link className="button button-dark" href="/sign-in">Customer sign in <span aria-hidden="true">↗</span></Link><Link className="portal-secondary" href="/sign-up">Create an account</Link></div> : <>
          <div className="portal-welcome"><div><p className="eyebrow"><span />CUSTOMER PORTAL · WELCOME BACK</p><h1>{profile.name}</h1><p>{profile.email} · {profile.phone}</p><label className="portal-preference"><input type="checkbox" checked={profile.whatsappOptIn === true} onChange={(event) => setProfile(saveCustomerProfile({ ...profile, whatsappOptIn: event.target.checked }))} /><span>Send my event progress updates on WhatsApp</span></label></div><Link className="button button-dark" href="/#booking">Plan an event <span aria-hidden="true">↗</span></Link></div>
          <div className="portal-summary"><article><span>ALL REQUESTS</span><strong>{myOrders.length.toString().padStart(2, "0")}</strong></article><article><span>UPCOMING EVENTS</span><strong>{upcoming.length.toString().padStart(2, "0")}</strong></article><article><span>PROFILE</span><strong>ACTIVE</strong></article></div>
          <section className="portal-bookings"><div className="portal-section-heading"><div><p className="eyebrow"><span />YOUR ACTIVITY</p><h2>Event requests & order history</h2></div><Link href="/#booking">Make a new request ↗</Link></div>
            {myOrders.length ? <div className="portal-request-list">{myOrders.map((order) => <article className="portal-request" key={order.id}><div className="portal-request-date"><strong>{new Date(`${order.date}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit" })}</strong><span>{new Date(`${order.date}T12:00:00`).toLocaleDateString("en-IN", { month: "short" })}</span></div><div className="portal-request-info"><strong>{order.venue}</strong><span>{order.area} · {order.guestCount.toLocaleString("en-IN")} guests</span><small>{order.dishes.join(", ") || "Menu to be discussed"}</small></div><div className="portal-request-status"><span className={`request-status status-${order.status.toLowerCase()}`}>{order.status}</span><strong>{money.format(order.estimate)}</strong></div></article>)}</div> : <div className="portal-empty"><strong>No requests yet</strong><p>Your submitted event enquiries will appear here, along with their latest progress.</p><Link href="/#booking">Plan your first gathering ↗</Link></div>}
          </section>
          <p className="portal-local-note">Demo mode: profiles and request history are stored only in this browser and are not shared with other devices.</p>
        </>}
      </section>
    </main>
  );
}
