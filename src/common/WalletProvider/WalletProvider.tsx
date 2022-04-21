import WalletConnectProvider from "@walletconnect/web3-provider";
import React from "react";

type ContextValue = {
  provider: WalletConnectProvider | null;
  createProvider: () => void;
};

export const WalletProviderContext = React.createContext<ContextValue>({
  provider: null,
  createProvider: () => {
    return;
  },
});

export const WalletProvider = React.memo(function WalletProvider(props: {
  children: React.ReactNode;
}) {
  const [provider, setProvider] = React.useState<WalletConnectProvider | null>(
    null,
  );

  const createProvider = React.useCallback(() => {
    const newProvider = new WalletConnectProvider({
      infuraId: process.env.INFURA_ID,
      storageId: "wallet-identity-connector",
      clientMeta: {
        name: "World ID Mock App",
        description: "World ID in the Test Network",
        url: "https://id.worldcoin.org/test",
        icons: [
          document.head.querySelector<HTMLLinkElement>("link[rel~=icon]")!.href,
        ],
      },
    });

    setProvider(newProvider);
  }, [setProvider]);

  const value: ContextValue = React.useMemo(
    () => ({
      provider,
      createProvider,
    }),
    [provider, createProvider],
  );

  return (
    <WalletProviderContext.Provider value={value}>
      {props.children}
    </WalletProviderContext.Provider>
  );
});
