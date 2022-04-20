import type { connectWallet } from "@/lib/init-walletconnect";

export type WalletConnectFlow = Partial<
  Awaited<ReturnType<typeof connectWallet>>
>;
