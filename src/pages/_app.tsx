import Layout from "@/components/Layout";
import StatusBar from "@/components/StatusBar";
import { METADATA } from "@/lib/constants";
import type { CacheStore } from "@/stores/cacheStore";
import { useCacheStore } from "@/stores/cacheStore";
import "@/styles/globals.css";
import type { AppContext, AppProps } from "next/app";
import localFont from "next/font/local";
import Head from "next/head";
import Script from "next/script";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useMediaQuery } from "usehooks-ts";

// Must be loaded after global styles
import { checkCache, retryDownload } from "@/lib/utils";

// World Pro, the variable typeface World App ships through the Nucleus design system.
const worldPro = localFont({
  src: "../../node_modules/@worldcoin/nucleus/fonts/WorldProMVP.ttf",
  weight: "300 800",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

const getStore = (store: CacheStore) => ({
  complete: store.complete,
  setComplete: store.setComplete,
});

export default function App({
  Component,
  pageProps,
}: AppProps<{ nonce: string }>) {
  const isMobile = useMediaQuery("(max-width: 499px)");
  const { setComplete } = useCacheStore(getStore);

  // Listen for service worker to complete semaphore downloads
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data === "CACHE_COMPLETE") {
          setComplete(true);
        }
      });
    }
  }, [setComplete]);

  // Check if semaphore files already exist in cache
  useEffect(() => {
    async function checkSemaphoreCache() {
      if (await checkCache()) {
        setComplete(true);
      } else {
        await retryDownload();
      }
    }

    void checkSemaphoreCache();
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
          color="#1F1F1F"
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

      <a
        href="https://world.org/blog/engineering/introducing-world-id-4.0"
        target="_blank"
        rel="noreferrer"
        className="fixed top-0 z-50 flex w-full items-center justify-center gap-x-2 bg-amber-100 px-4 py-2 text-center text-s3 text-amber-700"
      >
        This simulator will change with the adoption of World ID 4.0. Learn
        more.
      </a>

      <div className="h-dvh overflow-hidden pt-10">
        <Layout>
          <StatusBar />
          <Component {...pageProps} />
        </Layout>
      </div>

      <Toaster
        position={isMobile ? "bottom-center" : "top-right"}
        containerStyle={isMobile ? { bottom: 76 } : undefined}
        toastOptions={{
          duration: 1500,
          style: {
            background: "#F1F1F1",
            color: "#1F1F1F",
            borderRadius: 58,
            boxShadow: "0 10px 30px rgba(36, 57, 129, 0.1)",
            padding: "8px 12px",
            fontSize: 15,
            fontWeight: 450,
            fontFamily: worldPro.style.fontFamily,
          },
        }}
      />
      <style
        jsx
        global
      >{`
        :root {
          --font-world: ${worldPro.style.fontFamily};
        }
      `}</style>
      <Script
        id="sw"
        nonce={pageProps.nonce}
      >
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

App.getInitialProps = async (appContext: AppContext) => ({
  pageProps: {
    nonce: appContext.ctx.req?.headers["x-nonce"] as string,
  },
});
