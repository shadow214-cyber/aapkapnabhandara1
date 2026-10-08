import { readBinaryRecord } from "@/lib/server/persistent-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const imageTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
};

export async function GET(_request: Request, context: RouteContext<"/api/menu/images/[imageId]">) {
  const { imageId } = await context.params;
  const match = /^([a-f0-9]{32})\.(jpg|png|gif|webp|avif|bmp)$/.exec(imageId);
  if (!match) return new Response("Image not found.", { status: 404 });

  try {
    const image = await readBinaryRecord(`menu-images/${imageId}`);
    if (!image) return new Response("Image not found.", { status: 404 });
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": imageTypes[match[2]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Could not read menu photo.", error);
    return new Response("Could not load image.", { status: 500 });
  }
}
