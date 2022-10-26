import React from "react";
import * as ReactDOMClient from "react-dom/client";
import App from "./App/App";
import { ThemeProvider } from "./common/contexts/ThemeContext/ThemeContext";
import { WalletProvider } from "./common/contexts/WalletProvider/WalletProvider";
import "./index.css";

const container = document.getElementById("root");
if (!container) throw new ReferenceError(`Unable to found root element`);

const root = ReactDOMClient.createRoot(container);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
