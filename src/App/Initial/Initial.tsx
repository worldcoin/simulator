import { useIdentityStorage } from "@/common/hooks/use-identity-storage";
import { WalletProviderContext } from "@/common/WalletProvider/WalletProvider";
import { inclusionProof } from "@/lib/sequencer-service";
import { Phase } from "@/types/common";
import type { Identity as IdentityType } from "@/types/identity";
import { Web3Provider } from "@ethersproject/providers";
import { keccak256 } from "@ethersproject/solidity";
import { Strategy, ZkIdentity } from "@zk-kit/identity";
import cn from "classnames";
import React, { useContext } from "react";
import { encodeIdentityCommitment } from "../Identity/Identity";
import Card from "./Card/Card";

const Initial = React.memo(function Initial(props: {
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  className?: string;
  identity: IdentityType;
  setIdentity: React.Dispatch<React.SetStateAction<IdentityType>>;
}) {
  const providerContext = useContext(WalletProviderContext);
  const { storeIdentity } = useIdentityStorage();

  const provider = React.useMemo(
    () => providerContext.provider,
    [providerContext],
  );

  const updateIdentity = React.useCallback(
    async (newIdentity: ZkIdentity) => {
      const commitment = newIdentity.genIdentityCommitment();
      const trapdoor = newIdentity.getTrapdoor();
      const nullifier = newIdentity.getNullifier();

      const encodedCommitment = encodeIdentityCommitment(commitment);

      const id = encodedCommitment.slice(0, 10);
      let verified = false;
      let proof: IdentityType["inclusionProof"] = null;

      try {
        proof = await inclusionProof(encodedCommitment);
        verified = true;
      } catch (err) {
        console.warn(err);
      }

      const extendedIdentity: IdentityType = {
        ...props.identity,
        commitment,
        trapdoor,
        nullifier,
        id,
        verified,
        inclusionProof: proof,
      };

      props.setIdentity(extendedIdentity);
      storeIdentity({ ZkIdentity: newIdentity, id });
      props.setPhase(Phase.Identity);
    },
    [props, storeIdentity],
  );

  React.useEffect(() => {
    //  Enable session (triggers QR Code modal)
    provider
      ?.enable()
      .then(() => {
        props.setPhase(Phase.Signature);
        //  Create Web3 instance
        const web3provider = new Web3Provider(provider);
        const signer = web3provider.getSigner();
        const message =
          "Signature request to generate seed for World ID identity.";
        return signer.signMessage(message);
      })
      .then((signature) => {
        const identitySeed = keccak256(["bytes"], [signature]);
        return updateIdentity(new ZkIdentity(Strategy.MESSAGE, identitySeed));
      })
      .catch((error) =>
        console.error("Error while connecting to identity wallet:", error),
      )
      .finally(() => {
        provider.qrcodeModal.close();
        // we should wait for some event and then disconnect, to avoid error on the client
        // but for now we will just wait 2 seconds
        const cleanup = setTimeout(() => {
          if (provider.connected)
            provider.disconnect().catch(console.error.bind(console));
        }, 2000);
        provider.connector.on("disconnect", () => {
          console.log("Provider disconnected by user");
          clearTimeout(cleanup);
        });
      });
  }, [props, provider, updateIdentity]);

  const connectWallet = React.useCallback(() => {
    //  Create WalletConnect Provider
    providerContext.createProvider();
  }, [providerContext]);

  const createIdentity = React.useCallback(() => {
    const identity = new ZkIdentity(Strategy.RANDOM);
    return updateIdentity(identity);
  }, [updateIdentity]);

  return (
    <div
      className={cn(
        "grid content-start gap-y-12 pb-6 xs:pb-0",
        props.className,
      )}
    >
      <h1 className="z-10 text-24 font-semibold text-183c4a">Welcome</h1>

      <Card
        heading="Generate or load identity"
        text="Connect a real wallet through WalletConnect so your identity is persisted. If you go to an orb, you’ll be able to import your identity into the Worldcoin app in the future."
        buttonText="Connect wallet"
        buttonAction={connectWallet}
        tooltipText="We’ll use your wallet to generate a seed for your identity. If you connect the same wallet again, your same identity will be retrieved."
      />

      <Card
        className="mt-10"
        heading="Disposable identity"
        text="Create a disposable identity. Ideal for rapid testing and one-time verification flows."
        buttonText="Create temporary identity"
        buttonAction={createIdentity}
        altButton
      />
    </div>
  );
});

export default Initial;
