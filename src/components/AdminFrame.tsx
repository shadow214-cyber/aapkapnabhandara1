"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type AdminFrameProps = { title: string; active: string; children: ReactNode };

const navigation = [
  { href: "/admin", label: "Overview", mark: "01" },
  { href: "/admin/requests", label: "Event requests", mark: "02" },
  { href: "/admin/menu", label: "Menu & pricing", mark: "03" },
  { href: "/admin/customers", label: "Customers", mark: "04" },
  { href: "/admin/notifications", label: "Message delivery", mark: "05" },
  { href: "/admin/settings", label: "Admin setup", mark: "06" },
];

export function AdminFrame({ title, active, children }: AdminFrameProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/session").then((response) => response.json()).then((result: { authenticated?: boolean; email?: string | null }) => {
      if (!mounted) return;
      if (!result.authenticated) router.replace("/sign-in?role=admin");
      else setEmail(result.email ?? "");
      setChecked(true);
    }).catch(() => {
      if (mounted) {
        setChecked(true);
        router.replace("/sign-in?role=admin");
      }
    });
    return () => { mounted = false; };
  }, [router]);

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/sign-in?role=admin");
  }

  if (!checked || !email) return <main className="admin-loading">Checking administrator access…</main>;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/"><span className="pot-mark" aria-hidden="true"><span>U</span></span><span>Aapka Apna<br />Bhandara</span></Link>
        <p className="admin-sidebar-label">OPERATIONS</p>
        <nav aria-label="Admin navigation">{navigation.map((item) => <Link className={`admin-side-link${active === item.href ? " admin-side-link-active" : ""}`} href={item.href} key={item.href}><span>{item.mark}</span>{item.label}</Link>)}</nav>
        <div className="admin-sidebar-bottom"><span className="admin-status-dot" /> LOCAL PREVIEW<p>Records are stored in this browser.</p></div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar"><div><p className="admin-kicker">ADMIN WORKSPACE <span>·</span> AAPKA APNA</p><h1>{title}</h1></div><div className="admin-top-actions"><span>{email}</span><button type="button" onClick={signOut}>Sign out <span aria-hidden="true">↗</span></button></div></header>
        <div className="admin-content">{children}</div>
      </section>
    </main>
  );
}
