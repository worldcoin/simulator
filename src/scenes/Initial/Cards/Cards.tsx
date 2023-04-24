import React from "react";
import Card from "./Card/Card";

export const Cards = React.memo(function Cards() {
  return (
    <React.Fragment>
      <Card
        heading="Generate or load identity"
        text={
          <span>
            Connect <span className="font-semibold">any real wallet</span>{" "}
            through WalletConnect so your identity is persisted. Every time you
            connect the same wallet, the same World ID identity will be used.
          </span>
        }
        tooltipText="We’ll use your wallet to generate seed entropy for your identity. If you connect the same wallet again, the same identity will be used."
        icon="user-gradient"
      />

      <Card
        heading="Temporary identity"
        text="Create a temporary identity, will only be stored on cache. Ideal for rapid testing and one-time verification flows."
        icon="smile-gradient"
      />
    </React.Fragment>
  );
});
