import { randomBytes } from "node:crypto";
import { maxMenuImageBytes, maxMenuImageLabel } from "@/lib/menu-images";
import { getAdminSessionEmail } from "@/lib/server/admin-auth";
import { writeBinaryRecord } from "@/lib/server/persistent-store";
import { isSameOriginRequest } from "@/lib/server/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const supportedTypes: Record<string, { extension: string; matches: (bytes: Buffer) => boolean }> = {
  "image/jpeg": { extension: "jpg", matches: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", matches: (bytes) => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/gif": { extension: "gif", matches: (bytes) => bytes.subarray(0, 6).toString("ascii").match(/^GIF8[79]a$/) !== null },
  "image/webp": { extension: "webp", matches: (bytes) => bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" },
  "image/avif": { extension: "avif", matches: (bytes) => bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(bytes.toString("ascii", 8, 12)) },
  "image/bmp": { extension: "bmp", matches: (bytes) => bytes.length >= 2 && bytes.toString("ascii", 0, 2) === "BM" },
};

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  }
  if (!await getAdminSessionEmail()) {
    return Response.json({ error: "Sign in as an administrator to upload menu photos." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Could not read the uploaded image." }, { status: 400 });
  }
  const file = form.get("image");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (file.size === 0 || file.size > maxMenuImageBytes) {
    return Response.json({ error: `Choose an image smaller than ${maxMenuImageLabel}.` }, { status: 400 });
  }

  const imageType = supportedTypes[file.type];
  if (!imageType) {
    return Response.json({ error: "Use a JPEG, PNG, WebP, GIF, AVIF, or BMP image. SVG files are not supported." }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!imageType.matches(bytes)) {
    return Response.json({ error: "The file content does not match its image format." }, { status: 415 });
  }

  const imageId = randomBytes(16).toString("hex");
  const filename = `${imageId}.${imageType.extension}`;
  try {
    await writeBinaryRecord(`menu-images/${filename}`, bytes);
    return Response.json({ imageUrl: `/api/menu/images/${filename}` });
  } catch (error) {
    console.error("Could not save menu photo.", error);
    return Response.json({ error: "Could not save the uploaded image." }, { status: 500 });
  }
}
