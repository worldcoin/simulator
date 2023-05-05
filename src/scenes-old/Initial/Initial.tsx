// FIXME
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Button from "@/common/Button/Button";
import { Icon } from "@/common/Icon";
import { useIdentityStorage } from "@/common/hooks/use-identity-storage";
import { inclusionProof } from "@/lib/sequencer-service";
import { Phase } from "@/types/common";
import type { Identity as IdentityType } from "@/types/identity";
import { utils } from "@worldcoin/id";
import clsx from "clsx";
import { useModal } from "connectkit";
import React from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { encodeIdentityCommitment } from "../Identity/Identity";
import { Cards } from "./Cards/Cards";
import { Signature } from "./Signature/Signature";

// FIXME
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Strategy, ZkIdentity } = require("@zk-kit/identity");

const Initial = React.memo(function Initial(props: {
  phase: Phase;
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  className?: string;
  identity: IdentityType;
  setIdentity: React.Dispatch<React.SetStateAction<IdentityType>>;
}) {
  const { storeIdentity } = useIdentityStorage();
  const { setOpen: setConnectModalOpen } = useModal();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect({
    onSuccess: () => {
      props.setPhase(Phase.Initial);
    },
  });
  const { signMessage } = useSignMessage({
    message: "Signature request to generate seed for World ID identity.",
    onSuccess: (signature) => {
      const identitySeed = utils.keccak256(signature);

      return updateIdentity(new ZkIdentity(Strategy.MESSAGE, identitySeed));
    },
    onError: (error) => {
      console.error("Error while connecting to identity wallet:", error);
    },
  });

  const updateIdentity = React.useCallback(
    // FIXME
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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
    if (!isConnected) return;

    signMessage();
  }, [isConnected, signMessage]);

  const connectWallet = React.useCallback(() => {
    if (!isConnected) setConnectModalOpen(true);
  }, [isConnected, setConnectModalOpen]);

  const createIdentity = () => {
    const identity = new ZkIdentity(Strategy.RANDOM);
    updateIdentity(identity)
      .then(() => console.log("identity updated"))
      .catch((err) => console.log(err));
  };

  const goBack = React.useCallback(() => {
    if (!isConnected) {
      return console.error("Provider was not created");
    }
    disconnect();
  }, [disconnect, isConnected]);

  return (
    <div
      className={clsx(
        "grid content-between px-2 pb-6 xs:pb-0",
        props.className,
      )}
    >
      <div className={clsx("grid gap-y-6")}>
        <h1
          className={clsx(
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
          className={clsx(
            "w-full bg-4940e0 font-sora text-16 font-semibold text-ffffff",
            { "py-4": props.phase === Phase.Signature },
          )}
        >
          {props.phase === Phase.Initial && "CONNECT WALLET"}
          {props.phase === Phase.Signature && (
            <Icon
              name="spinner"
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
