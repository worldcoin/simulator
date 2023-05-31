import Layout from "@/components/Layout";
import StatusBar from "@/components/StatusBar";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { setupClient } from "@/services/walletconnect";
import "@/styles/globals.css";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import type { AppProps } from "next/app";
import { Rubik, Sora } from "next/font/google";
import Script from "next/script";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useMediaQuery } from "usehooks-ts";
import { WagmiConfig, createConfig } from "wagmi";

// Must be loaded after global styles
import "@/styles/react-toastify.css";

const sora = Sora({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "600", "700"],
});

const rubik = Rubik({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const config = createConfig(
  getDefaultConfig({
    appName: "Worldcoin Simulator",
    appDescription: "Test World ID",
    appUrl: "https://id.worldcoin.org/test",
    appIcon: "https://simulator.worldcoin.org/favicon.svg",
    infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PID!,
  }),
);

export default function App({ Component, pageProps }: AppProps) {
  const [ready, setReady] = useState(false);
  const isMobile = useMediaQuery("(max-width: 499px)");

  // Initialize WalletConnect
  useEffect(() => {
    const initialize = async () => {
      await setupClient();
      setReady(true);
    };

    if (!ready) {
      void initialize();
    }
  }, [ready]);
  useWalletConnect(ready);

  return (
    <>
      <WagmiConfig config={config}>
        <ConnectKitProvider>
          <Layout>
            <StatusBar />
            <Component {...pageProps} />
          </Layout>
        </ConnectKitProvider>
      </WagmiConfig>
      <ToastContainer
        position={isMobile ? "top-center" : "top-right"}
        autoClose={3000}
        hideProgressBar
        pauseOnHover
        closeButton={false}
      />
      <style
        jsx
        global
      >{`
        :root {
          --font-sora: ${sora.style.fontFamily};
          --font-rubik: ${rubik.style.fontFamily};
        }
      `}</style>
      <Script id="sw">
        {`
          if (typeof window !== 'undefined' && "serviceWorker" in navigator) {
            window.addEventListener("load", function() {
              navigator.serviceWorker.register("/sw.js").catch(function(error) {
                console.error("Error during service worker registration:", error);
              });
            });
          }
        `}
      </Script>
    </>
  );
}
