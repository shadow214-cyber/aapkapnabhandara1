"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AdminFrame } from "@/components/AdminFrame";

type AdminView = { id: string; name: string; email: string; phone: string; active: boolean; createdAt: string; source: "environment" | "server-store" };
type Draft = { id?: string; name: string; email: string; phone: string; password: string; active: boolean; source?: AdminView["source"] };
const emptyDraft = (): Draft => ({ name: "", email: "", phone: "", password: "", active: true });

export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState<AdminView[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const primaryAdminEmail = admins.find((admin) => admin.source === "environment")?.email;

  async function refresh() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const result = await response.json() as { admins?: AdminView[]; error?: string };
    if (!response.ok) throw new Error(result.error ?? "Could not load admin accounts.");
    setAdmins(result.admins ?? []);
  }

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/users", { cache: "no-store" }).then(async (response) => {
      const result = await response.json() as { admins?: AdminView[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not load admin accounts.");
      if (mounted) setAdmins(result.admins ?? []);
    }).catch((error: unknown) => { if (mounted) setNotice(error instanceof Error ? error.message : "Could not load admin accounts."); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function saveAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;
    setNotice("");
    setSaving(true);
    const body = { ...draft, password: draft.password || undefined };
    try {
      const response = await fetch("/api/admin/users", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not save admin account.");
      setDraft(null);
      setNotice(draft.id ? "Admin account updated." : "Admin account created. Share its password with that admin through a private channel.");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save admin account.");
    } finally {
      setSaving(false);
    }
  }

  async function updateActive(admin: AdminView, active: boolean) {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...admin, active }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) setNotice(result.error ?? "Could not update admin status.");
    else await refresh();
  }

  async function removeAdmin(admin: AdminView) {
    if (!window.confirm(`Permanently delete admin access for ${admin.email}?`)) return;
    const response = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: admin.id }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) setNotice(result.error ?? "Could not remove admin.");
    else { setNotice(`Admin access for ${admin.email} has been deleted.`); await refresh(); }
  }

  return (
    <AdminFrame title="Admin setup" active="/admin/settings">
      <div className="admin-page-heading"><div><p className="admin-kicker">ACCESS CONTROL <span>·</span> {admins.length} ADMINS</p><h2>Administrator accounts</h2><p className="admin-intro">Create and revoke individual logins. Passwords are hashed on the server and never shown again.</p></div><button className="admin-primary-button" type="button" onClick={() => { setDraft(emptyDraft()); setNotice(""); }}>Add admin <span aria-hidden="true">+</span></button></div>
      <div className="admin-prototype-note"><strong>About the primary admin:</strong> The account configured by <code>ADMIN_EMAIL</code>{primaryAdminEmail ? ` (${primaryAdminEmail})` : ""} is managed through private server settings and cannot be removed here. Use <strong>Add admin</strong> to create additional accounts. Extra admin accounts are stored on the app server (local files in development, Netlify Blobs in production).</div>
      {notice && <p className="admin-inline-notice" role="status">{notice}</p>}
      {draft && <form className="menu-editor" onSubmit={saveAdmin}><div className="menu-editor-heading"><div><p className="admin-kicker">{draft.id ? "EDIT LOGIN" : "NEW LOGIN"}</p><h3>{draft.id ? "Update administrator" : "Create administrator"}</h3></div><button className="admin-icon-button" type="button" aria-label="Close editor" onClick={() => setDraft(null)} disabled={saving}>×</button></div><div className="menu-editor-grid"><label>Full name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required maxLength={80} /></label><label>Email address<input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} required /></label><label>Mobile number<input type="tel" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} maxLength={30} /></label><label>{draft.id ? "New password (leave empty to keep current)" : "Temporary password · 12 characters minimum"}<input type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} minLength={12} required={!draft.id} autoComplete="new-password" /></label></div><div className="menu-editor-actions"><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save admin"}</button><button className="admin-quiet-button" type="button" onClick={() => setDraft(null)} disabled={saving}>Cancel</button></div></form>}
      {loading ? <p className="portal-loading">Loading admin accounts…</p> : admins.length ? <div className="team-admin-list">{admins.map((admin) => <article className="team-admin-card" key={admin.id}><div className="team-admin-mark" aria-hidden="true">{admin.name.charAt(0).toUpperCase() || "A"}</div><div className="team-admin-info"><strong>{admin.name}</strong><span>{admin.email}</span><span>{admin.phone || "No phone saved"}</span><small>{admin.source === "environment" ? "Environment-protected primary account" : `Added ${new Date(admin.createdAt).toLocaleDateString("en-IN")}`}</small></div><span className={`team-admin-tag${admin.active ? "" : " team-admin-inactive"}`}>{admin.active ? "ACTIVE" : "DISABLED"}</span><div className="menu-admin-actions">{admin.source === "server-store" && <><button type="button" onClick={() => { setDraft({ ...admin, password: "" }); setNotice(""); }}>Edit</button><button type="button" onClick={() => void updateActive(admin, !admin.active)}>{admin.active ? "Disable" : "Enable"}</button><button type="button" className="admin-danger-text" onClick={() => void removeAdmin(admin)}>Delete</button></>}</div></article>)}</div> : <div className="portal-empty"><strong>No admin accounts configured</strong><p>Set the primary admin credentials in `.env.local` before adding additional administrators.</p></div>}
      <section className="admin-channel-status"><p className="admin-kicker">NOTIFICATIONS</p><h3>Provider setup</h3><p>Configure automated email and WhatsApp delivery with verified provider credentials and an approved template.</p><a href="/admin/notifications">View message delivery ↗</a></section>
    </AdminFrame>
  );
}
