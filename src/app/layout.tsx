import { WalletProvider } from "@/common/contexts/WalletProvider/WalletProvider";
import Script from "next/script";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import "./react-toastify.css";

export const metadata = { title: "Worldcoin Simulator" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/x-icon"
          href="/favicon.svg"
        />
      </head>

      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>

      <Script id="sw">
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
      </Script>
    </html>
  );
}
