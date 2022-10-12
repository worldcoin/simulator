import Button from "@/common/Button/Button";
import { WalletProviderContext } from "@/common/contexts/WalletProvider/WalletProvider";
import { useIdentityStorage } from "@/common/hooks/use-identity-storage";
import { Icon } from "@/common/Icon";
import { inclusionProof } from "@/lib/sequencer-service";
import { Phase } from "@/types/common";
import type { Identity as IdentityType } from "@/types/identity";
import { Web3Provider } from "@ethersproject/providers";
import spinnerSvg from "@static/spinner.svg";
import { utils } from "@worldcoin/id";
import { Strategy, ZkIdentity } from "@zk-kit/identity";
import cn from "classnames";
import React, { useContext } from "react";
import { encodeIdentityCommitment } from "../Identity/Identity";
import { Cards } from "./Cards/Cards";
import { Signature } from "./Signature/Signature";

const Initial = React.memo(function Initial(props: {
  phase: Phase;
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  className?: string;
  identity: IdentityType;
  setIdentity: React.Dispatch<React.SetStateAction<IdentityType>>;
}) {
  const providerContext = useContext(WalletProviderContext);
  const { storeIdentity } = useIdentityStorage();

  const provider = React.useMemo(
    () => providerContext.provider,
    [providerContext.provider],
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
    updateIdentity(identity)
      .then(() => console.log("identity updated"))
      .catch((err) => console.log(err));
  };

  const goBack = React.useCallback(() => {
    if (!provider) {
      return console.error("Provider was not created");
    }
    provider.disconnect().catch(console.error.bind(console));

    provider.connector.on("disconnect", () => {
      console.log("Provider disconnected by user");
      props.setPhase(Phase.Initial);
    });
  }, [props, provider]);

  return (
    <div className={cn("grid content-between pb-6 xs:pb-0", props.className)}>
      <div className={cn("grid gap-y-6")}>
        <h1
          className={cn(
            "z-10 text-center font-sora text-30 font-semibold text-183c4a dark:text-ffffff",
            { "px-14 pb-6": props.phase === Phase.Initial },
          )}
        >
          {props.phase === Phase.Initial && "World ID simulator"}
          {props.phase === Phase.Signature && "Confirm the signature request"}
        </h1>

        {props.phase === Phase.Initial && <Cards />}
        {props.phase === Phase.Signature && <Signature />}
      </div>

      <div className="grid justify-items-center gap-y-6">
        <Button
          onClick={props.phase === Phase.Initial ? connectWallet : () => null}
          type="button"
          isDisabled={props.phase === Phase.Signature}
          className={cn(
            "w-full bg-4940e0 font-sora text-16 font-semibold text-ffffff",
            { "py-4": props.phase === Phase.Signature },
          )}
        >
          {props.phase === Phase.Initial && "CONNECT WALLET"}
          {props.phase === Phase.Signature && (
            <Icon
              data={spinnerSvg}
              className="pointer-events-none mx-auto h-6 w-6 animate-spin justify-self-center text-ffffff"
            />
          )}
        </Button>

        <Button
          onClick={
            {
              [`${Phase.Initial}`]: createIdentity,
              [`${Phase.Signature}`]: goBack,
            }[props.phase]
          }
          className="!p-0 text-18 font-medium text-858494"
        >
          {props.phase === Phase.Initial && "Create temporary identity"}
          {props.phase === Phase.Signature && "Cancel"}
        </Button>
      </div>
    </div>
  );
});

export default Initial;
