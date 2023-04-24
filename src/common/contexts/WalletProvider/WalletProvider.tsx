"use client";
import { ConnectKitProvider, getDefaultClient } from "connectkit";
import React from "react";
import { WagmiConfig, createClient } from "wagmi";

const client = createClient(
  getDefaultClient({
    appName: "Worldcoin Simulator",
    appDescription: "Test World ID",
    appUrl: "https://id.worldcoin.org/test",
    appIcon: "https://simulator.worldcoin.org/favicon.svg",
    infuraId: process.env.INFURA_ID,
  }),
);

export const WalletProvider = React.memo(function WalletProvider(props: {
  children: React.ReactNode;
}) {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider>{props.children}</ConnectKitProvider>
    </WagmiConfig>
  );
});
