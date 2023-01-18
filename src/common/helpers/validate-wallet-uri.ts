interface ParseWorldIDQRCodeOutput {
  valid: boolean;
  errorMessage?: string;
  uri?: string;
}

export const parseWorldIDQRCode = (data: string): ParseWorldIDQRCodeOutput => {
  // New version of World ID QR code
  const parsedUrl = new URL(data);
  const topic = parsedUrl.searchParams.get("t");
  const version = parsedUrl.searchParams.get("v");
  const relay = parsedUrl.searchParams.get("r");
  const key = parsedUrl.searchParams.get("k");

  console.log("data:", data);

  if (!topic || !version || !relay || !key) {
    return {
      valid: false,
      errorMessage: "Improperly formed World ID QR code. Parameters missing.",
    };
  }

  return {
    uri: `wc:${topic}@${version}?relay-protocol=${relay}&symKey=${key}`,
    valid: true,
  };
};
