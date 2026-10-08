"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { createPortalOrder, getCustomerSession } from "@/lib/portal-data";
import { getMenuItemsSnapshot, getServerMenuItemsSnapshot, loadMenuItems, subscribeToMenuItems, type MenuLanguage } from "@/lib/menu-data";
import { EventDatePicker } from "@/components/EventDatePicker";

type Language = MenuLanguage;

const words = {
  en: {
    announcement: "Pure vegetarian catering, made for good company", navMenu: "The menu", navStory: "Our way", navContact: "Contact", signIn: "Sign in", signUp: "Sign up",
    heroEyebrow: "FOR THE MOMENTS THAT BRING US TOGETHER", heroTitle: "Good food.\nFull hearts.", heroText: "A proper bhandara, made easy. Build a menu your people will remember.", browse: "Build your menu", note: "A little gathering goes a long way.", visualLabel: "A table set for everyone",
    menuEyebrow: "FRESH FROM OUR KITCHEN", menuTitle: "The good things,\nserved together.", menuText: "Choose your favourites. We’ll help shape the rest around your gathering.", sample: "Sample menu · rates are placeholders", add: "Add to menu", added: "Added", plan: "Plan your gathering", guests: "How many guests?", tierPeople: "guests", custom: "Or enter a number", estimate: "Estimated food total", perGuest: "per guest", selected: "Your menu", empty: "Add a dish to start your menu.", dishes: "dishes", estimateNote: "Illustrative estimate only. Final pricing depends on your event and service needs.",
    bookingEyebrow: "LET’S MAKE IT A DAY TO REMEMBER", bookingTitle: "Tell us a little\nabout your day.", bookingText: "Share your plans and our team can help with the menu, service and details.", name: "Your name", email: "Email address", phone: "Mobile number", date: "Event date", area: "Event area · Delhi NCR only", areaPlaceholder: "Choose a service area", venue: "Venue name and address", guestsField: "Guest count", message: "Anything else we should know?", consent: "I agree to be contacted about this event enquiry.", whatsappConsent: "Send me booking updates on WhatsApp.", send: "Prepare my enquiry", localOnly: "Preview: saved in this browser only; no message is sent.", formSuccess: "Your enquiry is saved in this browser. No message has been sent.", areaNotice: "Currently serving Delhi and Delhi NCR only.",
    serviceEyebrow: "THE LITTLE DETAILS MATTER", serviceTitle: "We bring the warmth.\nYou bring your people.", serviceText: "A thoughtful meal is only part of a good gathering. We’ll talk through what your venue needs.", serviceItems: ["Pure vegetarian menu", "Freshly prepared for your date", "Serving setup planned together"], terms: "A few useful notes", termsText: "Menu, rates, travel, serving staff and setup are confirmed after we understand your event. Sample prices are not a final quote. A booking is confirmed only after our team agrees the details with you.", contactTitle: "Let’s plan something lovely.", contactPlaceholder: "Contact details to be confirmed", footerNote: "Menu, rates and contact details are placeholders until confirmed.", cart: "Menu",
  },
  hi: {
    announcement: "शुद्ध शाकाहारी भोजन, अपनों की महफ़िल के लिए", navMenu: "मेन्यू", navStory: "हमारी सेवा", navContact: "संपर्क", signIn: "साइन इन", signUp: "खाता बनाएं",
    heroEyebrow: "हर उस पल के लिए जो हमें साथ लाता है", heroTitle: "अच्छा खाना।\nअपनों का साथ।", heroText: "अपनों के लिए भंडारा, अब आसान। ऐसा मेन्यू बनाएं जिसे सब याद रखें।", browse: "मेन्यू बनाएं", note: "छोटी सी महफ़िल, ढेर सारी खुशियाँ।", visualLabel: "सबके लिए सजी हुई दावत",
    menuEyebrow: "हमारी रसोई से ताज़ा", menuTitle: "स्वाद सबका,\nखुशियाँ साथ में।", menuText: "अपनी पसंद चुनें, बाकी आयोजन में हम साथ देंगे।", sample: "नमूना मेन्यू · दरें केवल अनुमानित", add: "मेन्यू में जोड़ें", added: "जोड़ा गया", plan: "आयोजन की योजना", guests: "कितने मेहमान?", tierPeople: "मेहमान", custom: "या संख्या लिखें", estimate: "खाने का अनुमान", perGuest: "प्रति मेहमान", selected: "आपका मेन्यू", empty: "मेन्यू शुरू करने के लिए व्यंजन जोड़ें।", dishes: "व्यंजन", estimateNote: "यह केवल शुरुआती अनुमान है। अंतिम कीमत आयोजन और सेवा के अनुसार तय होगी।",
    bookingEyebrow: "इस दिन को यादगार बनाएं", bookingTitle: "अपने आयोजन के\nबारे में बताएं।", bookingText: "अपनी योजना साझा करें, हम मेन्यू और सेवा में मदद करेंगे।", name: "आपका नाम", email: "ईमेल पता", phone: "मोबाइल नंबर", date: "आयोजन की तारीख़", area: "आयोजन का क्षेत्र · केवल दिल्ली NCR", areaPlaceholder: "सेवा का क्षेत्र चुनें", venue: "जगह का नाम और पता", guestsField: "मेहमानों की संख्या", message: "कोई और ज़रूरी बात?", consent: "मैं इस आयोजन की पूछताछ के बारे में संपर्क किए जाने के लिए सहमत हूँ।", whatsappConsent: "मुझे WhatsApp पर बुकिंग अपडेट भेजें।", send: "पूछताछ तैयार करें", localOnly: "डेमो: जानकारी केवल इस ब्राउज़र में सेव होती है, कोई संदेश नहीं भेजा जाता।", formSuccess: "आपकी पूछताछ इस ब्राउज़र में सेव हुई। कोई संदेश नहीं भेजा गया।", areaNotice: "अभी केवल दिल्ली और दिल्ली NCR में सेवा उपलब्ध है।",
    serviceEyebrow: "छोटी बातें भी ज़रूरी हैं", serviceTitle: "खुशियाँ हमारी।\nअपनों को आप लाएं।", serviceText: "अच्छे आयोजन में सिर्फ खाना नहीं, अपनापन भी ज़रूरी है। जगह की ज़रूरतें हम साथ तय करेंगे।", serviceItems: ["शुद्ध शाकाहारी मेन्यू", "आपकी तारीख़ के लिए ताज़ा भोजन", "परोसने की व्यवस्था साथ तय होगी"], terms: "कुछ ज़रूरी बातें", termsText: "मेन्यू, दरें, यात्रा, स्टाफ और व्यवस्था आयोजन समझने के बाद तय होगी। दिखाई गई दरें अंतिम कोट नहीं हैं। टीम से सभी बातें पक्की होने पर ही बुकिंग पक्की होगी।", contactTitle: "चलिए, कुछ खास बनाते हैं।", contactPlaceholder: "संपर्क जानकारी की पुष्टि बाकी है", footerNote: "मेन्यू, दरें और संपर्क जानकारी पुष्टि होने तक नमूना हैं।", cart: "मेन्यू",
  },
} as const;

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function PotMark({ small = false }: { small?: boolean }) {
  return <span className={`pot-mark${small ? " pot-mark-small" : ""}`} aria-hidden="true"><span>U</span></span>;
}

export default function Home() {
  const dishes = useSyncExternalStore(subscribeToMenuItems, getMenuItemsSnapshot, getServerMenuItemsSnapshot).filter((dish) => dish.active);
  const [language, setLanguage] = useState<Language>("en");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState("300");
  const [submitted, setSubmitted] = useState(false);
  const [orderSummary, setOrderSummary] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDateError, setEventDateError] = useState("");
  useEffect(() => {
    void loadMenuItems().catch((error: unknown) => {
      console.error("Could not load the current menu.", error);
    });
  }, []);
  const text = { ...words[language], signIn: language === "en" ? "Login" : "लॉग इन", formSuccess: language === "en" ? "Your request is saved in this browser. Delivery results are shown below." : "आपकी पूछताछ इस ब्राउज़र में सेव हुई। संदेश की स्थिति नीचे दी गई है।" };
  const guestCount = Math.min(10000, Math.max(1, Number(guestInput) || 1));
  const selectedDishes = dishes.filter((dish) => selectedIds.includes(dish.id));
  const perGuest = selectedDishes.reduce((sum, dish) => sum + dish.price, 0);
  const total = perGuest * guestCount;

  function toggleDish(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((dishId) => dishId !== id) : [...current, id]);
  }

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!eventDate) {
      setEventDateError(language === "hi" ? "कृपया आयोजन की तारीख़ चुनें।" : "Please choose your event date.");
      return;
    }
    setEventDateError("");
    const fields = new FormData(event.currentTarget);
    const guestName = String(fields.get("name") ?? "").trim();
    const guestEmail = String(fields.get("email") ?? "").trim();
    const guestPhone = String(fields.get("phone") ?? "").trim();
    const selectedEventDate = String(fields.get("date") ?? "");
    const serviceArea = String(fields.get("serviceArea") ?? "");
    const venue = String(fields.get("venue") ?? "").trim();
    const order = createPortalOrder({
      name: guestName,
      email: guestEmail,
      phone: guestPhone,
      date: selectedEventDate,
      area: serviceArea,
      venue,
      guestCount: Number(fields.get("guests") ?? guestCount),
      dishes: selectedDishes.map((dish) => dish.name.en),
      estimate: total,
      message: String(fields.get("message") ?? "").trim(),
      whatsappOptIn: fields.has("whatsappOptIn") || getCustomerSession()?.whatsappOptIn === true,
    });
    const summary = `Request ${order.id.slice(0, 8).toUpperCase()} · ${guestName} · ${guestEmail} · ${selectedEventDate} · ${serviceArea}: ${venue} · ${order.guestCount} guests · ${order.dishes.join(", ") || "Menu to discuss"} · ${money.format(total)}`;
    setOrderSummary(summary);
    setSubmitted(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...order, contactConsent: fields.has("contactConsent") }),
      });
      const result = await response.json() as { email?: string; whatsapp?: string };
      setOrderSummary(`${summary} · Email: ${result.email ?? "not sent"} · WhatsApp: ${result.whatsapp ?? "not sent"}`);
    } catch {
      setOrderSummary(`${summary} · Notifications unavailable`);
    }
  }

  return (
    <main>
      <div className="announcement"><span className="announcement-dot" />{text.announcement}<span className="announcement-right">EST. WITH LOVE <b>✳</b></span></div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Aapka Apna Bhandara home"><PotMark /><span>Aapka Apna<br />Bhandara</span></a>
        <nav className="main-nav" aria-label="Main navigation"><a href="#menu">{text.navMenu}</a><a href="#service">{text.navStory}</a><a href="#booking">{text.navContact}</a><Link href="/sign-in">{text.signIn}</Link><Link className="nav-sign-up" href="/sign-up">{text.signUp}<span aria-hidden="true">↗</span></Link></nav>
        <div className="header-actions"><div className="language-switch" aria-label="Choose language"><button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button><span>/</span><button type="button" aria-pressed={language === "hi"} onClick={() => setLanguage("hi")}>हि</button></div><a className="header-order" href="#menu"><span className="order-bag" aria-hidden="true">▱</span>{text.cart}<span className="cart-count">{selectedIds.length}</span></a></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow"><span />{text.heroEyebrow}</p><h1>{text.heroTitle}</h1><p className="hero-intro">{text.heroText}</p><div className="hero-actions"><a className="button button-dark" href="#menu">{text.browse}<span aria-hidden="true">↗</span></a><span className="hero-note"><i />{text.note}</span></div><div className="hero-proof"><span className="proof-line" /><span>PURE VEG</span><span>·</span><span>MADE TO SHARE</span></div></div>
        <div className="hero-art" role="img" aria-label={language === "en" ? "Indian vegetarian feast served for a gathering" : "महफ़िल के लिए सजा भारतीय शाकाहारी भोजन"}><div className="art-image" /><div className="art-wash" /><span className="art-index">AAPKA APNA <i>·</i> 01 / 06</span><div className="art-stamp"><span>MADE</span><PotMark small /><span>TO SHARE</span></div><div className="art-caption"><span className="caption-rule" />{text.visualLabel}<span className="caption-arrow">↗</span></div><span className="art-side-note">FRESH · PURE · TOGETHER</span></div>
        <span className="hero-number">01 <i /> 06</span>
      </section>

      <section className="menu-section" id="menu">
        <div className="section-heading"><div><p className="eyebrow"><span />{text.menuEyebrow}</p><h2>{text.menuTitle}</h2></div><div className="menu-intro"><p>{text.menuText}</p><span className="placeholder-note">{text.sample}</span></div></div>
        <div className="menu-layout"><div className="dish-grid">{dishes.map((dish, index) => {
          const isSelected = selectedIds.includes(dish.id);
          return <article className={`dish-card ${isSelected ? "dish-selected" : ""}`} key={dish.id}><div className={`dish-art ${dish.tone}${dish.imageUrl ? " dish-art-photo" : ""}`} role={dish.imageUrl ? "img" : undefined} aria-label={dish.imageUrl ? dish.name[language] : undefined} style={dish.imageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.42)), url("${dish.imageUrl}")` } : undefined}><span className="dish-number">0{index + 1} / 06</span>{!dish.imageUrl && <span className="dish-art-mark"><PotMark small /></span>}<span className="dish-category">{dish.category[language]}</span></div><div className="dish-details"><div className="dish-title-line"><h3>{dish.name[language]}</h3><span className="dish-price">{money.format(dish.price)}<small> / {language === "en" ? "guest" : "व्यक्ति"}</small></span></div><p>{dish.description[language]}</p><button type="button" className="dish-add" aria-pressed={isSelected} onClick={() => toggleDish(dish.id)}><span aria-hidden="true">{isSelected ? "−" : "+"}</span>{isSelected ? text.added : text.add}</button></div></article>;
        })}</div>

        <aside className="order-panel" aria-live="polite"><div className="order-panel-head"><div><p className="eyebrow"><span />{text.plan}</p><h3>{text.guests}</h3></div><span className="order-icon" aria-hidden="true">↗</span></div><div className="guest-tiers" aria-label={text.guests}>{[300, 500].map((tier) => <button key={tier} type="button" className={guestInput === String(tier) ? "tier-active" : ""} aria-pressed={guestInput === String(tier)} onClick={() => setGuestInput(String(tier))}><strong>{tier}</strong><span>{text.tierPeople}</span></button>)}</div><label className="guest-custom">{text.custom}<span className="guest-entry"><input aria-label={text.custom} type="number" min="1" max="10000" value={guestInput} onChange={(event) => setGuestInput(event.target.value)} /><span>{text.tierPeople}</span></span></label><div className="order-rule" /><div className="selected-heading"><strong>{text.selected}</strong><span>{selectedDishes.length} {text.dishes}</span></div>{selectedDishes.length ? <ul className="selected-list">{selectedDishes.map((dish) => <li key={dish.id}><span>{dish.name[language]}</span><strong>{money.format(dish.price * guestCount)}</strong></li>)}</ul> : <p className="empty-menu">{text.empty}</p>}<div className="order-total"><span>{text.estimate}</span><strong>{money.format(total)}</strong></div><p className="order-disclaimer">{text.estimateNote}</p><a className="button button-red" href="#booking">{text.plan}<span aria-hidden="true">↗</span></a></aside></div>
      </section>

      <section className="service-section" id="service"><div className="service-inner"><div className="service-copy"><p className="eyebrow"><span />{text.serviceEyebrow}</p><h2>{text.serviceTitle}</h2><p>{text.serviceText}</p><a className="text-link" href="#booking">{text.navContact}<span aria-hidden="true">→</span></a></div><div className="service-detail"><div className="service-list">{text.serviceItems.map((item, index) => <div className="service-row" key={item}><span>0{index + 1}</span><strong>{item}</strong><span aria-hidden="true">↗</span></div>)}</div><div className="terms-block"><span className="terms-mark"><PotMark small /></span><div><strong>{text.terms}</strong><p>{text.termsText}</p></div></div></div></div></section>

      <section className="booking-section" id="booking"><div className="booking-copy"><p className="eyebrow"><span />{text.bookingEyebrow}</p><h2>{text.bookingTitle}</h2><p>{text.bookingText}</p><div className="contact-note"><span className="contact-symbol">↗</span><div><strong>{text.contactTitle}</strong><span>{text.contactPlaceholder}</span></div></div><p className="coverage-note">{text.areaNotice}</p></div><form className="booking-form" onSubmit={submitEnquiry}><div className="form-heading"><span>01 <i /> 02</span><p>{text.plan}</p></div><div className="form-row"><label>{text.name}<input name="name" autoComplete="name" required /></label><label>{text.email}<input name="email" type="email" autoComplete="email" required /></label></div><div className="form-row"><label>{text.phone}<input name="phone" type="tel" autoComplete="tel" required /></label><EventDatePicker error={eventDateError} language={language} onChange={(value) => { setEventDate(value); setEventDateError(""); }} value={eventDate} /></div><div className="form-row"><label>{text.area}<select name="serviceArea" defaultValue="" required><option value="" disabled>{text.areaPlaceholder}</option><option value="Delhi">Delhi</option><option value="New Delhi">New Delhi</option><option value="Gurugram">Gurugram</option><option value="Noida">Noida</option><option value="Greater Noida">Greater Noida</option><option value="Ghaziabad">Ghaziabad</option><option value="Faridabad">Faridabad</option><option value="Sonipat">Sonipat</option><option value="Bahadurgarh">Bahadurgarh</option><option value="Meerut">Meerut</option><option value="Rohtak">Rohtak</option><option value="Panipat">Panipat</option><option value="Rewari">Rewari</option><option value="Other Delhi NCR">Other Delhi NCR</option></select></label><label>{text.guestsField}<input name="guests" type="number" min="1" max="10000" value={guestInput} onChange={(event) => setGuestInput(event.target.value)} required /></label></div><label>{text.venue}<input name="venue" autoComplete="address-level2" required /></label><label>{text.message}<textarea name="message" rows={3} /></label><label className="consent-row"><input type="checkbox" name="contactConsent" required /><span>{text.consent}</span></label>{submitted && <div className="form-result" role="status"><strong>{text.formSuccess}</strong><span>{orderSummary}</span></div>}<button className="button button-dark form-submit" type="submit">{text.send}<span aria-hidden="true">↗</span></button><p className="form-footnote">{text.localOnly}</p></form></section>

      <footer className="site-footer"><div className="footer-main"><a className="brand" href="#top"><PotMark /><span>Aapka Apna<br />Bhandara</span></a><p>{text.footerNote}</p><a href="#top" className="back-top">{language === "en" ? "Back to top ↑" : "वापस ऊपर ↑"}</a></div><span className="footer-bottom">AAPKA APNA BHANDARA <i>·</i> GOOD FOOD, SHARED WELL <span>© 2026</span></span></footer>
    </main>
  );
}
