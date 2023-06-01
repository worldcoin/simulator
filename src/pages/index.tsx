import Button from "@/components/Button";
import { Card } from "@/components/Card";
import Confirm from "@/components/Confirm";
import { Dropdown } from "@/components/Dropdown";
import useIdentity from "@/hooks/useIdentity";
import type { Identity } from "@/types";
import { Chain, CredentialType } from "@/types";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import { useModal } from "connectkit";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { keccak256 } from "viem";
import { useAccount, useSignMessage } from "wagmi";

export default function Home() {
  const router = useRouter();
  const { setOpen } = useModal();
  const { isConnected } = useAccount();
  const { identity, retrieveIdentity, createIdentity, updateIdentity } =
    useIdentity();

  const [isSigning, setIsSigning] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [chain, setChain] = useState<Chain>(Chain.Polygon);

  const { signMessage } = useSignMessage({
    message: "Signature request to generate seed for World ID identity.",
    onSuccess: async (signature) => {
      const seed = keccak256(signature);
      const zkIdentity = new ZkIdentity(seed);
      const identity: Identity = {
        id: "",
        zkIdentity,
        chain,
        persisted: true,
        verified: {
          [CredentialType.Orb]: false,
          [CredentialType.Phone]: false,
        },
        inclusionProof: {
          [CredentialType.Orb]: null,
          [CredentialType.Phone]: null,
        },
      };
      const newIdentity = await updateIdentity(identity);

      // Display confirmed state for 2 seconds
      setIsConfirmed(true);
      setTimeout(() => {
        void router.push(`/id/${newIdentity.id}`);
      }, 2000);
    },
    onError: (error) => {
      setIsSigning(false);
      console.error("Error while connecting to identity wallet:", error);
    },
  });

  const handleConnectWallet = () => {
    // Open modal if not connected
    if (!isConnected) setOpen(true);

    // Replace identity from wallet seed if connected
    if (isConnected && !identity?.persisted) {
      setIsSigning(true);
      signMessage();
    }

    // Route to identity page if connected and identity is persistent
    if (isConnected && identity?.persisted) {
      void router.push(`/id/${identity.id}`);
    }
  };

  const handleCreateTemporaryIdentity = () => {
    void createIdentity(chain).then((newIdentity) => {
      void router.push(`/id/${newIdentity.id}`);
    });
  };

  // Generate persistent identity seed from connected wallet
  useEffect(() => {
    if (!isConnected || identity) return;

    signMessage();
  }, [identity, isConnected, signMessage]);

  // On initial load, restore previous identity from storage
  useEffect(() => {
    void retrieveIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // <div className="px-2 pb-6 xs:pb-0">
    <>
      {!isSigning && (
        <div className="flex flex-col gap-y-4">
          <h1 className="mt-1 text-center font-sora text-h2 text-gray-900 xs:mt-4 xs:text-h1">
            Create your test World ID
          </h1>
          <p className="text-center text-b2 text-gray-500">
            With the World ID Simulator, you can test different scenarios with
            your identity.
          </p>
          <Dropdown
            options={[
              {
                label: "Polygon Mumbai",
                src: "/icons/polygon.svg",
                alt: "The Polygon logo",
                chain: Chain.Polygon,
              },
              // TODO: Re-enable when Optimism is supported
              // {
              //   label: "Optimism Goerli",
              //   src: "/icons/optimism.svg",
              //   alt: "The Optimism logo",
              //   chain: Chain.Optimism,
              // },
            ]}
            setChain={setChain}
          />
          <Card
            icon="user"
            heading="Generate persistent identity"
            text="Use WalletConnect to link your wallet and keep your World ID identity consistent for each subsequent connection."
          >
            <Button
              onClick={handleConnectWallet}
              className="mt-5 w-full bg-gray-900 py-3 font-sora text-14 font-semibold text-white"
            >
              Generate Persistent ID
            </Button>
          </Card>

          <Card
            icon="clock"
            heading="Create a temporary identity"
            text="Stored only on cache. Ideal for rapid testing and one-time verification flows. Create a temporary identity."
            iconBgClassName="bg-info-700"
          >
            <Button
              onClick={handleCreateTemporaryIdentity}
              className="mt-5 w-full bg-gray-900 py-3 font-sora text-14 font-semibold text-white"
            >
              Create Temporary ID
            </Button>
          </Card>
        </div>
      )}
      {isSigning && <Confirm isConfirmed={isConfirmed} />}
    </>
  );
}
