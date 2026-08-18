import { getBusinessSettings } from "@/lib/business";

export const size = { width: 32, height: 32 };
export const dynamic = "force-dynamic";

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#D2491C" />
  <path d="M40 30 L26 50 L40 70" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="50" cy="50" r="13" fill="none" stroke="#FFFFFF" stroke-width="9" />
  <path d="M60 30 L74 50 L60 70" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

function responseFromDataUrl(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const [, contentType, base64] = match;
  return new Response(Buffer.from(base64, "base64"), {
    headers: { "Content-Type": contentType },
  });
}

export default async function Icon() {
  const settings = await getBusinessSettings();
  const dataUrl = settings.faviconDataUrl ?? settings.logoDataUrl;
  const response = dataUrl ? responseFromDataUrl(dataUrl) : null;
  if (response) return response;

  return new Response(FALLBACK_SVG, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
