import Button from "@/components/Button";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import useIdentity from "@/hooks/useIdentity";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import { useModal } from "connectkit";
import { keccak256 } from "ethers/lib/utils.js";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

export default function Home() {
  const router = useRouter();
  const { setOpen } = useModal();
  const { isConnected } = useAccount();
  const { identity, retrieveIdentity, createIdentity, updateIdentity } =
    useIdentity();

  const [isSigning, setIsSigning] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { signMessage } = useSignMessage({
    message: "Signature request to generate seed for World ID identity.",
    onSuccess: async (signature) => {
      const identitySeed = keccak256(signature);
      const newIdentity = await updateIdentity(
        new ZkIdentity(identitySeed),
        true,
      );

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

  const handleCreateTemporaryIdentity = async () => {
    const newIdentity = await createIdentity();
    void router.push(`/id/${newIdentity.id}`);
  };

  // On initial load, restore previous identity from storage
  useEffect(() => {
    void retrieveIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate persistent identity seed from connected wallet
  useEffect(() => {
    if (!isConnected || identity) return;

    signMessage();
  }, [identity, isConnected, signMessage]);

  return (
    <div className="px-2 pb-6 xs:pb-0">
      {!isSigning && (
        <div className="grid content-between gap-y-6">
          <h1 className="mt-16 text-center font-sora text-26 font-semibold text-191c20">
            What can you do with the Simulator?
          </h1>
          <Card
            icon="user"
            heading="Generate persistent identity"
            text="Use WalletConnect to link your wallet and keep your World ID identity consistent for each subsequent connection."
          >
            <Button
              onClick={handleConnectWallet}
              className="mt-5 w-full bg-191c20 py-3 font-sora text-14 font-semibold text-ffffff"
            >
              Generate Persistent ID
            </Button>
          </Card>

          <Card
            icon="clock"
            heading="Create a temporary identity"
            text="Stored only on cache. Ideal for rapid testing and one-time verification flows. Create a temporary identity."
            iconBgClassName="bg-506dff"
          >
            <Button
              onClick={handleCreateTemporaryIdentity}
              className="mt-5 w-full bg-191c20 py-3 font-sora text-14 font-semibold text-ffffff"
            >
              Create Temporary ID
            </Button>
          </Card>
          <p className=" mt-10 text-center text-14 text-9ba3ae">Version 2.0</p>
        </div>
      )}
      {isSigning && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <Icon
            name="shield"
            className="h-10 w-10 text-4940e0"
            bgClassName="w-20 h-20 rounded-full bg-f0f0fd"
          />
          <h1 className="mt-8 font-sora text-30 font-semibold text-191c20">
            Confirm signature request
          </h1>
          <p className="mt-4 font-rubik text-18 text-657080">
            Please confirm the signature request in your wallet to generate your
            World ID identity.
          </p>
          <div className="absolute bottom-12 flex items-center">
            {!isConfirmed && (
              <>
                <Icon
                  name="spinner"
                  className="h-6 w-6 animate-spin text-000000"
                />
                <span className="ml-2 text-16 font-semibold text-657080">
                  Confirmation pending
                </span>
              </>
            )}
            {isConfirmed && (
              <>
                <Icon
                  name="checkmark"
                  className="h-4 w-4 text-ffffff "
                  bgClassName="rounded-full w-6 h-6 bg-00c313"
                />
                <span className="ml-2 text-16 font-semibold text-00c313">
                  Confirmed
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
