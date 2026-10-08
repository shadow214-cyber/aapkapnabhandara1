"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { AdminFrame } from "@/components/AdminFrame";
import { maxMenuImageBytes, maxMenuImageLabel } from "@/lib/menu-images";
import { defaultMenuItems, getMenuItemsSnapshot, getServerMenuItemsSnapshot, loadMenuItems, subscribeToMenuItems, writeMenuItems, type MenuDish } from "@/lib/menu-data";

type Draft = Omit<MenuDish, "price"> & { price: string };
const blankDraft = (): Draft => ({ id: "", name: { en: "", hi: "" }, description: { en: "", hi: "" }, category: { en: "NEW DISH", hi: "नया व्यंजन" }, price: "", tone: "dish-gold", active: true });
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const imageTypes = "image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp";

export default function AdminMenuPage() {
  const items = useSyncExternalStore(subscribeToMenuItems, getMenuItemsSnapshot, getServerMenuItemsSnapshot);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState("");
  const [menuReady, setMenuReady] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadMenuItems()
      .catch((error: unknown) => {
        if (mounted) setNotice(error instanceof Error ? error.message : "Could not load the saved menu.");
      })
      .finally(() => {
        if (mounted) setMenuReady(true);
      });
    return () => { mounted = false; };
  }, []);

  function editItem(item: MenuDish) {
    setNotice("");
    setDraft({ ...item, price: String(item.price) });
  }

  function updateDraft(field: string, value: string) {
    setDraft((current) => {
      if (!current) return current;
      if (field === "name.en" || field === "name.hi") return { ...current, name: { ...current.name, [field.slice(5)]: value } };
      if (field === "description.en" || field === "description.hi") return { ...current, description: { ...current.description, [field.slice(12)]: value } };
      if (field === "category.en" || field === "category.hi") return { ...current, category: { ...current.category, [field.slice(9)]: value } };
      return { ...current, [field]: value };
    });
  }

  async function uploadImage(file: File | undefined) {
    if (!draft || !file) return;
    if (!imageTypes.split(",").includes(file.type)) {
      setNotice("Choose a JPEG, PNG, WebP, GIF, AVIF, or BMP image.");
      return;
    }
    if (file.size > maxMenuImageBytes) {
      setNotice(`Choose an image smaller than ${maxMenuImageLabel}.`);
      return;
    }
    setNotice("");
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.set("image", file);
      const response = await fetch("/api/menu/images", { method: "POST", body: form });
      const result = await response.json() as { imageUrl?: string; error?: string };
      if (!response.ok || !result.imageUrl) throw new Error(result.error ?? "Could not upload the image.");
      setDraft((current) => current ? { ...current, imageUrl: result.imageUrl } : current);
      setNotice("Photo uploaded. Save the dish to publish it on the menu.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not upload the image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setNotice("");
    const price = Number(draft.price);
    if (!draft.name.en.trim() || !draft.name.hi.trim() || !Number.isFinite(price) || price < 0) {
      setNotice("Add the dish name in both languages and a valid non-negative price.");
      return;
    }
    let imageUrl = draft.imageUrl?.trim();
    if (imageUrl && !imageUrl.startsWith("/api/menu/images/")) {
      try {
        const parsedUrl = new URL(imageUrl);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
        imageUrl = parsedUrl.href;
      } catch {
        setNotice("Enter a valid image link starting with http:// or https://.");
        return;
      }
    }
    const item: MenuDish = { ...draft, id: draft.id || crypto.randomUUID(), price, active: draft.active, imageUrl: imageUrl || undefined };
    try {
      await writeMenuItems(draft.id ? items.map((current) => current.id === draft.id ? item : current) : [item, ...items]);
      setDraft(null);
      setNotice(`${item.name.en} saved. The customer menu is updated.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save the dish.");
    }
  }

  async function toggleItem(item: MenuDish) {
    try {
      await writeMenuItems(items.map((current) => current.id === item.id ? { ...current, active: !current.active } : current));
      setNotice(`${item.name.en} ${item.active ? "hidden from" : "shown on"} the customer menu.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update the dish.");
    }
  }

  async function deleteItem(item: MenuDish) {
    if (!window.confirm(`Permanently remove ${item.name.en} from the menu?`)) return;
    try {
      await writeMenuItems(items.filter((current) => current.id !== item.id));
      setNotice(`${item.name.en} removed from the menu.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not remove the dish.");
    }
  }

  async function resetMenu() {
    if (!window.confirm("Restore the original sample menu? This replaces all menu edits.")) return;
    try {
      await writeMenuItems(defaultMenuItems);
      setNotice("The sample menu has been restored.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not restore the sample menu.");
    }
  }

  return (
    <AdminFrame title="Menu & pricing" active="/admin/menu">
      <div className="admin-page-heading"><div><p className="admin-kicker">CUSTOMER MENU <span>·</span> {items.filter((item) => item.active).length} VISIBLE</p><h2>Menu management</h2><p className="admin-intro">Edit both language versions and per-guest prices. Changes are saved on the app server and shared with visitors.</p></div><button type="button" className="admin-primary-button" onClick={() => { setDraft(blankDraft()); setNotice(""); }}>Add dish <span aria-hidden="true">+</span></button></div>
      {notice && <p className="admin-inline-notice" role="status">{notice}</p>}
      {!menuReady && <p className="portal-loading">Loading the saved menu…</p>}
      {draft && <form className="menu-editor" onSubmit={saveItem}><div className="menu-editor-heading"><div><p className="admin-kicker">{draft.id ? "EDIT ITEM" : "NEW ITEM"}</p><h3>{draft.id ? "Update dish" : "Add a dish"}</h3></div><button type="button" className="admin-icon-button" aria-label="Close editor" onClick={() => setDraft(null)}>×</button></div><div className="menu-editor-grid"><label>English name<input value={draft.name.en} onChange={(event) => updateDraft("name.en", event.target.value)} maxLength={80} required /></label><label>Hindi name<input value={draft.name.hi} onChange={(event) => updateDraft("name.hi", event.target.value)} maxLength={80} required /></label><label>Price per guest (₹)<input type="number" min="0" step="1" value={draft.price} onChange={(event) => updateDraft("price", event.target.value)} required /></label><label>English category<input value={draft.category.en} onChange={(event) => updateDraft("category.en", event.target.value)} maxLength={40} /></label><label>Hindi category<input value={draft.category.hi} onChange={(event) => updateDraft("category.hi", event.target.value)} maxLength={40} /></label><label>Card colour<select value={draft.tone} onChange={(event) => updateDraft("tone", event.target.value)}><option value="dish-saffron">Saffron</option><option value="dish-tomato">Tomato</option><option value="dish-leaf">Leaf</option><option value="dish-gold">Gold</option><option value="dish-yogurt">Yogurt</option><option value="dish-coral">Coral</option></select></label>
        <div className="menu-photo-field menu-editor-wide">
          <span>Dish photo</span>
          <label>Image link<input type="url" value={draft.imageUrl?.startsWith("/api/menu/images/") ? "" : draft.imageUrl ?? ""} onChange={(event) => setDraft((current) => current ? { ...current, imageUrl: event.target.value } : current)} placeholder="https://example.com/your-dish.jpg" maxLength={2048} /></label>
          <small>Paste a direct image URL, or upload a photo below. Use an http:// or https:// link.</small>
          {draft.imageUrl && <div className="menu-photo-preview"><div role="img" aria-label={`Preview photo of ${draft.name.en || "dish"}`} style={{ backgroundImage: `url("${draft.imageUrl}")` }} /><button type="button" className="admin-quiet-button" onClick={() => setDraft((current) => current ? { ...current, imageUrl: undefined } : current)}>Remove photo</button></div>}
          <label className="menu-photo-picker"><span>{uploadingImage ? "Uploading photo…" : "Upload a photo"}</span><small>JPEG, PNG, WebP, GIF, AVIF, or BMP · up to {maxMenuImageLabel}</small><input type="file" accept={imageTypes} disabled={uploadingImage} onChange={(event) => { void uploadImage(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /></label>
        </div>
        <label className="menu-editor-wide">English description<textarea value={draft.description.en} onChange={(event) => updateDraft("description.en", event.target.value)} rows={2} maxLength={180} /></label><label className="menu-editor-wide">Hindi description<textarea value={draft.description.hi} onChange={(event) => updateDraft("description.hi", event.target.value)} rows={2} maxLength={180} /></label></div><div className="menu-editor-actions"><button className="admin-primary-button" type="submit" disabled={uploadingImage}>{uploadingImage ? "Uploading photo…" : "Save dish"}</button><button className="admin-quiet-button" type="button" onClick={() => setDraft(null)}>Cancel</button></div></form>}
      {menuReady && <div className="menu-admin-list">{items.map((item) => <article className={`menu-admin-item${item.active ? "" : " menu-admin-item-hidden"}`} key={item.id}><div className={`dish-art ${item.tone}${item.imageUrl ? " dish-art-photo" : ""}`} role={item.imageUrl ? "img" : undefined} aria-label={item.imageUrl ? item.name.en : undefined} style={item.imageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.42)), url("${item.imageUrl}")` } : undefined}><span className="dish-category">{item.category.en}</span></div><div className="menu-admin-info"><span className="menu-admin-state">{item.active ? "VISIBLE ON SITE" : "HIDDEN FROM SITE"}</span><h3>{item.name.en}</h3><p>{item.name.hi}</p><small>{item.description.en}</small></div><strong className="menu-admin-price">{money.format(item.price)}<small> / guest</small></strong><div className="menu-admin-actions"><button type="button" onClick={() => editItem(item)}>Edit</button><button type="button" onClick={() => void toggleItem(item)}>{item.active ? "Hide" : "Show"}</button><button type="button" className="admin-danger-text" onClick={() => void deleteItem(item)}>Remove</button></div></article>)}</div>}
      {!items.length && <div className="portal-empty"><strong>No menu items yet</strong><p>Add a dish to make it available on the customer page.</p></div>}
      <button type="button" className="admin-reset-link" onClick={resetMenu}>Restore sample menu</button>
    </AdminFrame>
  );
}
