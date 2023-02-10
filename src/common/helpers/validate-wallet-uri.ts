interface ParseWorldIDQRCodeOutput {
  valid: boolean;
  errorMessage?: string;
  uri?: string;
}

export const parseWorldIDQRCode = (data: string): ParseWorldIDQRCodeOutput => {
  // New version of World ID QR code
  const parsedUrl = new URL(data);
  const uri = parsedUrl.searchParams.get("w");
  const wcRegex = /^wc:[A-Za-z0-9]+@2/;

  if (!uri || !uri.match(wcRegex)) {
    return { valid: false };
  }

  return {
    uri,
    valid: true,
  };
};
