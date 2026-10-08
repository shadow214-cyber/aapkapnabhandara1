export type MenuLanguage = "en" | "hi";
export type MenuDish = {
  id: string;
  name: Record<MenuLanguage, string>;
  description: Record<MenuLanguage, string>;
  price: number;
  category: Record<MenuLanguage, string>;
  tone: string;
  active: boolean;
  imageUrl?: string;
};

export const defaultMenuItems: MenuDish[] = [
  { id: "puri", name: { en: "Puri & seasonal aloo", hi: "पूरी और मौसमी आलू" }, description: { en: "Golden, puffed puris with gently spiced potato curry.", hi: "गरमागरम पूरी के साथ हल्के मसालेदार आलू की सब्ज़ी।" }, price: 95, category: { en: "THE CLASSIC", hi: "पारंपरिक" }, tone: "dish-saffron", active: true },
  { id: "chole", name: { en: "Amritsari chole", hi: "अमृतसरी छोले" }, description: { en: "Slow-cooked chickpeas, finished with fresh coriander.", hi: "धीमी आँच पर पके छोले, ताज़े धनिये के साथ।" }, price: 110, category: { en: "A CROWD FAVOURITE", hi: "सबकी पसंद" }, tone: "dish-tomato", active: true },
  { id: "rice", name: { en: "Jeera rice", hi: "जीरा चावल" }, description: { en: "Fragrant basmati rice with toasted cumin and herbs.", hi: "भुने जीरे और खुशबूदार मसालों वाले बासमती चावल।" }, price: 75, category: { en: "THE COMFORT", hi: "सुकून का स्वाद" }, tone: "dish-leaf", active: true },
  { id: "halwa", name: { en: "Sooji halwa", hi: "सूजी का हलवा" }, description: { en: "A warm, cardamom-scented finish with a little crunch.", hi: "इलायची की खुशबू और मेवों की हल्की कुरकुराहट।" }, price: 65, category: { en: "SWEET ENDING", hi: "मीठा अंत" }, tone: "dish-gold", active: true },
  { id: "raita", name: { en: "Cucumber raita", hi: "खीरे का रायता" }, description: { en: "Cool, creamy yogurt with cucumber and roasted cumin.", hi: "खीरे और भुने जीरे वाला ठंडा, मलाईदार रायता।" }, price: 45, category: { en: "COOL & FRESH", hi: "ठंडा और ताज़ा" }, tone: "dish-yogurt", active: true },
  { id: "jalebi", name: { en: "Jalebi & rabri", hi: "जलेबी और रबड़ी" }, description: { en: "Crisp, syrupy jalebi with a spoon of slow-set rabri.", hi: "कुरकुरी चाशनी वाली जलेबी के साथ गाढ़ी रबड़ी।" }, price: 85, category: { en: "A LITTLE JOY", hi: "थोड़ी सी खुशी" }, tone: "dish-coral", active: true },
];

const changedEvent = "aapb-menu-change";
let cachedItems: MenuDish[] = defaultMenuItems;
let loadPromise: Promise<void> | undefined;

export function getMenuItemsSnapshot() {
  return cachedItems;
}

export function getServerMenuItemsSnapshot() {
  return defaultMenuItems;
}

export function subscribeToMenuItems(onChange: () => void) {
  window.addEventListener(changedEvent, onChange);
  return () => {
    window.removeEventListener(changedEvent, onChange);
  };
}

export async function loadMenuItems() {
  if (!loadPromise) {
    const pending = fetch("/api/menu", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { items?: MenuDish[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Could not load the menu.");
        if (!Array.isArray(result.items)) throw new Error("The server returned an invalid menu.");
        cachedItems = result.items;
        window.dispatchEvent(new Event(changedEvent));
      })
      .finally(() => {
        loadPromise = undefined;
      });
    loadPromise = pending;
  }
  return loadPromise;
}

export async function writeMenuItems(items: MenuDish[]) {
  const response = await fetch("/api/menu", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const result = await response.json() as { items?: MenuDish[]; error?: string };
  if (!response.ok) throw new Error(result.error ?? "Could not save the menu.");
  if (!Array.isArray(result.items)) throw new Error("The server returned an invalid menu.");
  cachedItems = result.items;
  window.dispatchEvent(new Event(changedEvent));
}
