import Layout from "@/components/Layout";
import StatusBar from "@/components/StatusBar";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { METADATA } from "@/lib/constants";
import { setupClient } from "@/services/walletconnect";
import type { CacheStore } from "@/stores/cacheStore";
import { useCacheStore } from "@/stores/cacheStore";
import "@/styles/globals.css";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import type { AppProps } from "next/app";
import { Rubik, Sora } from "next/font/google";
import Head from "next/head";
import Script from "next/script";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useMediaQuery } from "usehooks-ts";
import { WagmiConfig, createConfig } from "wagmi";

// Must be loaded after global styles
import { checkFilesInCache } from "@/lib/utils";
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
    appName: METADATA.name,
    appDescription: METADATA.description,
    appUrl: METADATA.url,
    appIcon: METADATA.icons[0],
    infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PID!,
  }),
);

const getStore = (store: CacheStore) => ({
  complete: store.complete,
  setComplete: store.setComplete,
});

export default function App({ Component, pageProps }: AppProps) {
  const [ready, setReady] = useState(false);
  const isMobile = useMediaQuery("(max-width: 499px)");
  const { setComplete } = useCacheStore(getStore);

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

  // Listen for service worker to complete semaphore downloads
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data === "semaphore cache complete") {
          setComplete(true);
        }
      });
    }
  }, [setComplete]);

  // Check if semaphore files already exist in cache
  useEffect(() => {
    async function checkCache() {
      const files = ["/semaphore/semaphore.wasm", "/semaphore/semaphore.zkey"];
      const filesInCache = await checkFilesInCache(files);
      if (filesInCache.every(Boolean)) {
        setComplete(true);
      }
    }

    void checkCache();
  }, [setComplete]);

  return (
    <>
      <Head>
        <title>{METADATA.name}</title>
        <meta
          name="description"
          content={METADATA.description}
        />

        <link
          rel="manifest"
          href="/favicon/site.webmanifest"
        />
        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          color="#191919"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
      </Head>
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
