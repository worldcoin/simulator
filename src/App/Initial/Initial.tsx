import Button from "@/common/Button/Button";
import { useIdentityStorage } from "@/common/hooks/use-identity-storage";
import { WalletProviderContext } from "@/common/WalletProvider/WalletProvider";
import { inclusionProof } from "@/lib/sequencer-service";
import { Phase } from "@/types/common";
import type { Identity as IdentityType } from "@/types/identity";
import { Web3Provider } from "@ethersproject/providers";
import smileSvg from "@static/smile-gradient.svg";
import userSvg from "@static/user-gradient.svg";
import { utils } from "@worldcoin/id";
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
        const identitySeed = utils.keccak256(signature);

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

  const createIdentity = () => {
    const identity = new ZkIdentity(Strategy.RANDOM);
    return updateIdentity(identity);
  };

  return (
    <div className={cn("grid content-between pb-6 xs:pb-0", props.className)}>
      <div className="grid gap-y-8">
        <h1 className="z-10 px-14 pb-4 text-center font-sora text-30 font-semibold text-183c4a">
          World ID simulator
        </h1>

        <Card
          heading="Generate or load identity"
          text={
            <span>
              Connect <span className="font-semibold">any real wallet</span>{" "}
              through WalletConnect so your identity is persisted. Every time
              you connect the same wallet, the same World ID identity will be
              used.
            </span>
          }
          tooltipText="We’ll use your wallet to generate seed entropy for your identity. If you connect the same wallet again, the same identity will be used."
          icon={userSvg}
        />

        <Card
          heading="Temporary identity"
          text="Create a temporary identity, will only be stored on cache. Ideal for rapid testing and one-time verification flows."
          icon={smileSvg}
        />
      </div>

      <div className="grid justify-items-center gap-y-6">
        <Button
          onClick={connectWallet}
          type="button"
          className="w-full bg-4940e0 font-sora text-16 font-semibold text-ffffff"
        >
          CONNECT WALLET
        </Button>

        <Button
          onClick={createIdentity}
          className="!p-0 text-18 font-medium text-858494"
        >
          Create temporary identity
        </Button>
      </div>
    </div>
  );
});

export default Initial;
