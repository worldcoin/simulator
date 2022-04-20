import {
  parseWalletConnectUri,
  isWalletConnectSession,
} from "@walletconnect/utils";

export const validateWalletUri = (
  data: string,
): { valid: boolean; message: string } => {
  const uri = parseWalletConnectUri(data);

  if (uri.protocol !== "wc" || !isWalletConnectSession(uri)) {
    return {
      valid: false,
      message: `Not a WalletConnect session URI: ${data}`,
    };
  }

  return { valid: true, message: "Success" };
};
