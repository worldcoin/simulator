import type { connectWallet } from "@/services/walletconnect";

export type WalletConnectFlow = Partial<
  Awaited<ReturnType<typeof connectWallet>>
>;
