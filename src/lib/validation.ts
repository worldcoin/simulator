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

  if (!uri?.match(wcRegex)) {
    return { valid: false };
  }

  return {
    uri,
    valid: true,
  };
};

export const validateImageUrl = (url: string) => {
  try {
    const ic = new URL(url);
    return (
      ic.protocol === "data:" ||
      ic.protocol === "https:" ||
      ic.protocol === document.location.protocol
    );
  } catch {
    return false;
  }
};
