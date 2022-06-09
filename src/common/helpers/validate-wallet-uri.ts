import {
  isWalletConnectSession,
  parseWalletConnectUri,
} from "@walletconnect/utils";

interface ParseWorldIDQRCodeOutput {
  valid: boolean;
  errorMessage?: string;
  uri?: string;
}

export const parseWorldIDQRCode = (data: string): ParseWorldIDQRCodeOutput => {
  if (data.startsWith("https://worldcoin.org/verify")) {
    // New version of World ID QR code
    const parsedUrl = new URL(data);
    const key = parsedUrl.searchParams.get("k");
    const bridge = parsedUrl.searchParams.get("b");
    const handshakeTopic = parsedUrl.searchParams.get("t");
    const version = parsedUrl.searchParams.get("v");

    console.log(key, bridge, handshakeTopic, version);

    if (!key || !bridge || !handshakeTopic || !version) {
      return {
        valid: false,
        errorMessage: "Improperly formed World ID QR code. Parameters missing.",
      };
    }

    const encodedBridge = encodeURIComponent(`https://${bridge}`);
    return {
      uri: `wc:${handshakeTopic}@${version}?bridge=${encodedBridge}&key=${key}`,
      valid: true,
    };
  }

  // Legacy version of QR code
  // TODO: Legacy support should be removed after August 31
  const parsedUri = parseWalletConnectUri(data);

  if (parsedUri.protocol !== "wc" || !isWalletConnectSession(parsedUri)) {
    return {
      valid: false,
      errorMessage: `Not a WalletConnect session URI: ${data}`,
    };
  }

  console.warn(
    "DEPRECATED. This QR code version is deprecated and support will be removed soon. Please upgrade the JS widget to version 0.0.3 or above.",
  );
  alert(
    "This QR code version is deprecated and support will be removed soon. Please upgrade the JS widget to version 0.0.3 or above.",
  );

  return { valid: true, uri: data };
};
