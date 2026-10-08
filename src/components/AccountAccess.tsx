"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveCustomerCredential, verifyCustomerCredential } from "@/lib/customer-auth";
import { findCustomerProfile, saveCustomerProfile, saveCustomerSession } from "@/lib/portal-data";

type AccountAccessProps = { mode: "sign-in" | "sign-up"; initialRole?: AccountRole };
type AccountRole = "customer" | "admin";

export function AccountAccess({ mode, initialRole = "customer" }: AccountAccessProps) {
  const router = useRouter();
  const signingUp = mode === "sign-up";
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    if (signingUp) {
      const profile = saveCustomerProfile({
        name: String(form.get("name") ?? ""),
        email,
        phone: String(form.get("phone") ?? ""),
        whatsappOptIn: form.has("whatsappOptIn"),
      });
      await saveCustomerCredential(email, password);
      saveCustomerSession(profile);
      router.push("/account");
      return;
    }

    if (role === "admin") {
      try {
        const response = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) {
          setNotice(result.error ?? "Admin sign-in failed.");
          setBusy(false);
          return;
        }
        router.push("/admin");
      } catch {
        setNotice("Could not reach the server. Try again when the site is online.");
        setBusy(false);
      }
      return;
    }

    const profile = findCustomerProfile(email);
    if (!profile || !(await verifyCustomerCredential(email, password))) {
      setNotice("Email or password is incorrect. Create a profile first if you are new.");
      setBusy(false);
      return;
    }
    saveCustomerSession(profile);
    router.push("/account");
  }

  return (
    <main className="access-page">
      <header className="access-header">
        <Link className="brand" href="/" aria-label="Aapka Apna Bhandara home">
          <span className="pot-mark" aria-hidden="true"><span>U</span></span>
          <span>Aapka Apna<br />Bhandara</span>
        </Link>
        <Link className="access-back" href="/">← Back to the menu</Link>
      </header>
      <section className="access-layout">
        <div className="access-copy">
          <p className="eyebrow"><span />{role === "admin" ? "ADMIN WORKSPACE" : "CUSTOMER ACCOUNT"}</p>
          <h1>{signingUp ? "Make room\nfor good times." : role === "admin" ? "Welcome to\nthe workspace." : "Good to have\nyou back."}</h1>
          <p>{signingUp ? "Create a profile to keep your event plans and order progress together." : role === "admin" ? "Sign in to review enquiries and update their progress." : "Sign in to follow your event requests and see your previous orders."}</p>
          <span className="access-area">CURRENT SERVICE AREA <strong>DELHI & NCR</strong></span>
        </div>
        <form className="access-form" onSubmit={submit}>
          {!signingUp && <div className="access-role-switch" aria-label="Choose account type">
            <button type="button" aria-pressed={role === "customer"} onClick={() => { setRole("customer"); setNotice(""); }}>Customer</button>
            <button type="button" aria-pressed={role === "admin"} onClick={() => { setRole("admin"); setNotice(""); }}>Admin</button>
          </div>}
          <p className="eyebrow"><span />{signingUp ? "CREATE YOUR PROFILE" : role === "admin" ? "ADMIN SIGN IN" : "CUSTOMER SIGN IN"}</p>
          {signingUp && <label>Full name<input name="name" autoComplete="name" required maxLength={80} /></label>}
          <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
          {signingUp && <label>Mobile number<input name="phone" type="tel" autoComplete="tel" required /></label>}
          {signingUp && <label className="access-consent"><input name="whatsappOptIn" type="checkbox" /><span>Send me booking updates on WhatsApp. I can change this choice later.</span></label>}
          <label>{signingUp && role === "customer" ? "Password (at least 6 characters)" : "Password"}<input name="password" type="password" autoComplete={signingUp ? "new-password" : "current-password"} minLength={role === "customer" ? 6 : 1} required /></label>
          {notice && <p className="access-notice" role="alert">{notice}</p>}
          <button className="button button-dark access-submit" type="submit" disabled={busy}>
            {busy ? "Please wait…" : signingUp ? "Create account" : `Sign in as ${role}`}<span aria-hidden="true">↗</span>
          </button>
          <p className="access-boundary">{role === "admin" && !signingUp ? "Admin credentials are checked by the server and never stored in this browser." : "Customer demo accounts and requests stay in this browser only; this is not a production account service."}</p>
          {!signingUp && role === "admin" && <p className="access-switch">Use the admin email configured on the server.</p>}
          <p className="access-switch">{signingUp ? "Already have an account?" : "New to us?"} <Link href={signingUp ? "/sign-in" : "/sign-up"}>{signingUp ? "Sign in" : "Create an account"} ↗</Link></p>
        </form>
      </section>
    </main>
  );
}
