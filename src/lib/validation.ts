import type { ParseWorldIDQRCodeOutput } from "@/types";

export function parseWorldIDQRCode(data: string): ParseWorldIDQRCodeOutput {
  const url = new URL(data);
  const uri = url.searchParams.get("w");
  const wcRegex = /^wc:[A-Za-z0-9]+@2/;

  if (!uri?.match(wcRegex)) {
    return { valid: false };
  }

  return {
    uri,
    valid: true,
  };
}

export function validateImageUrl(data: string): boolean {
  try {
    const url = new URL(data);
    return (
      url.protocol === "data:" ||
      url.protocol === "https:" ||
      url.protocol === document.location.protocol
    );
  } catch {
    return false;
  }
}
