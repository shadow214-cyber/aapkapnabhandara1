import { defaultMenuItems, type MenuDish } from "@/lib/menu-data";
import { getAdminSessionEmail } from "@/lib/server/admin-auth";
import { readJsonRecord, writeJsonRecord } from "@/lib/server/persistent-store";
import { isSameOriginRequest } from "@/lib/server/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const menuKey = "menu-items.json";
const allowedTones = new Set(["dish-saffron", "dish-tomato", "dish-leaf", "dish-gold", "dish-yogurt", "dish-coral"]);

function isLocalizedText(value: unknown): value is Record<"en" | "hi", string> {
  return typeof value === "object" && value !== null
    && "en" in value && typeof value.en === "string"
    && "hi" in value && typeof value.hi === "string";
}

function isMenuDish(value: unknown): value is MenuDish {
  if (typeof value !== "object" || value === null) return false;
  return "id" in value && typeof value.id === "string" && value.id.length > 0
    && "name" in value && isLocalizedText(value.name)
    && "description" in value && isLocalizedText(value.description)
    && "category" in value && isLocalizedText(value.category)
    && "price" in value && typeof value.price === "number" && Number.isFinite(value.price) && value.price >= 0
    && "tone" in value && typeof value.tone === "string" && allowedTones.has(value.tone)
    && "active" in value && typeof value.active === "boolean"
    && (!("imageUrl" in value) || value.imageUrl === undefined
      || (typeof value.imageUrl === "string" && value.imageUrl.length <= 2048 && isAllowedImageUrl(value.imageUrl)));
}

function isAllowedImageUrl(value: string) {
  if (/^\/api\/menu\/images\/[a-f0-9]{32}\.(jpg|png|gif|webp|avif|bmp)$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function readMenu(): Promise<MenuDish[]> {
  const parsed = await readJsonRecord<unknown>(menuKey);
  if (parsed == null) return defaultMenuItems;
  if (!Array.isArray(parsed) || !parsed.every(isMenuDish)) {
    throw new Error("The saved menu file has an invalid format.");
  }
  return parsed;
}

async function writeMenu(items: MenuDish[]) {
  await writeJsonRecord(menuKey, items);
}

export async function GET() {
  try {
    return Response.json({ items: await readMenu() });
  } catch (error) {
    console.error("Could not read saved menu.", error);
    return Response.json({ error: "Could not load the saved menu." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  }
  if (!await getAdminSessionEmail()) {
    return Response.json({ error: "Sign in as an administrator to edit the menu." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid menu update." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("items" in body)
    || !Array.isArray(body.items) || !body.items.every(isMenuDish)) {
    return Response.json({ error: "The menu contains invalid dish details." }, { status: 400 });
  }

  try {
    await writeMenu(body.items);
    return Response.json({ items: body.items });
  } catch (error) {
    console.error("Could not save menu changes.", error);
    return Response.json({ error: "Could not save the menu changes." }, { status: 500 });
  }
}
