import React from "react";
import Card from "./Card/Card";

export const Cards = React.memo(function Cards() {
  return (
    <div className="mt-10 grid gap-y-4">
      <Card
        number={1}
        title="Generate or load identity"
        text="Connect any real wallet through WalletConnect so your identity is persisted. Every time you connect the same wallet, the same World ID identity will be used."
        hint="Simulates the flow with an Orb"
      />

      <Card
        number={2}
        title="Phone Number"
        text="Simulates the flow with a randomly generated phone number verification."
      />

      <Card
        number={3}
        title="Temporary identity"
        text="Create a temporary identity, will only be stored on cache. Ideal for rapid testing and one-time verification flows."
        hint="Simulates the flow with an Orb"
      />
    </div>
  );
});
