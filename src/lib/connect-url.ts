import { parseWorldIDQRCode } from "@/lib/validation";

export const CONNECT_URL_QUERY_KEY = "connect_url";

export function readSingleQueryValue(
  value: string[] | string | undefined,
): string | null {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim() || null;
  }

  return null;
}

export async function isValidConnectUrl(url: string): Promise<boolean> {
  try {
    const parsed = await parseWorldIDQRCode(url);
    return parsed.valid;
  } catch {
    return false;
  }
}
