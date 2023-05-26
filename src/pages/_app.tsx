import { Icon } from "@/components/Icon";
import Layout from "@/components/Layout";
import StatusBar from "@/components/StatusBar";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { setupClient } from "@/services/walletconnect";
import "@/styles/globals.css";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import type { AppProps } from "next/app";
import { Rubik, Sora } from "next/font/google";
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
  const isMobile = useMediaQuery("(max-width: 499px)");
  const [ready, setReady] = useState(false);

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
        position={isMobile ? "bottom-center" : "top-right"}
        autoClose={3500}
        hideProgressBar
        pauseOnHover
        closeButton={({ closeToast }) => (
          <button
            className="border-l border-f0edf9 p-4"
            onClick={closeToast}
          >
            <Icon
              name="cross"
              className="h-5 w-5 text-191c20"
            />
          </button>
        )}
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
      {/* <Script id="sw">
        {`
          // NOTE: disable for ssr 
          if (typeof window === 'undefined') {
            return;
          }
          
          if ("serviceWorker" in navigator) {
            window.addEventListener("load", function() {
              navigator.serviceWorker.register("/sw.js").catch(function(error) {
                console.error("Error during service worker registration:", error);
              });
            });
          }
        `}
      </Script> */}
    </>
  );
}
