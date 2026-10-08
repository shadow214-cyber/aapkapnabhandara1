"use client";

import { useState, useSyncExternalStore } from "react";
import { AdminFrame } from "@/components/AdminFrame";
import { deleteCustomerData, getCustomerProfiles, getPortalOrders, getServerCustomerProfilesSnapshot, getServerPortalOrdersSnapshot, subscribeToPortalData } from "@/lib/portal-data";

export default function AdminCustomersPage() {
  const customers = useSyncExternalStore(subscribeToPortalData, getCustomerProfiles, getServerCustomerProfilesSnapshot);
  const orders = useSyncExternalStore(subscribeToPortalData, getPortalOrders, getServerPortalOrdersSnapshot);
  const [query, setQuery] = useState("");
  const visible = customers.filter((customer) => `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query.toLowerCase()));

  function removeCustomer(email: string, name: string) {
    if (window.confirm(`Delete ${name}'s profile and all related requests from this browser?`)) deleteCustomerData(email);
  }

  return (
    <AdminFrame title="Customers" active="/admin/customers">
      <div className="admin-page-heading"><div><p className="admin-kicker">CUSTOMER DIRECTORY <span>·</span> {customers.length} PROFILES</p><h2>Customer records</h2><p className="admin-intro">Review saved profiles and their request history. Removing a profile also removes its local enquiries.</p></div></div>
      <label className="admin-search">Search customers<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, phone" /></label>
      {visible.length ? <div className="customer-admin-list">{visible.map((customer) => {
        const requests = orders.filter((order) => order.email.toLowerCase() === customer.email.toLowerCase());
        return <article className="customer-admin-row" key={customer.email}><div className="customer-admin-avatar" aria-hidden="true">{customer.name.charAt(0).toUpperCase()}</div><div className="customer-admin-main"><strong>{customer.name}</strong><span>{customer.email}</span><span>{customer.phone || "No phone saved"}</span></div><div className="customer-admin-count"><strong>{requests.length.toString().padStart(2, "0")}</strong><span>REQUESTS</span></div><button className="admin-danger-button" type="button" onClick={() => removeCustomer(customer.email, customer.name)}>Delete profile</button></article>;
      })}</div> : <div className="portal-empty"><strong>{customers.length ? "No matching customers" : "No customer profiles yet"}</strong><p>Profiles created in this browser will appear here.</p></div>}
      <p className="portal-local-note">Customer profile records are browser-local and are not a shared CRM or verified identity store.</p>
    </AdminFrame>
  );
}
