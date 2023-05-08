import Button from "@/components/Button";
import { Card } from "@/components/Card";
import Confirm from "@/components/Confirm";
import useIdentity from "@/hooks/useIdentity";
import { Strategy, ZkIdentity } from "@zk-kit/identity";
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

  const [version, setVersion] = useState("2.0");
  const [isSigning, setIsSigning] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { signMessage } = useSignMessage({
    message: "Signature request to generate seed for World ID identity.",
    onSuccess: async (signature) => {
      const identitySeed = keccak256(signature);
      const newIdentity = await updateIdentity(
        new ZkIdentity(Strategy.MESSAGE, identitySeed),
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

  const handleCreateTemporaryIdentity = () => {
    void createIdentity().then((newIdentity) => {
      void router.push(`/id/${newIdentity.id}`);
    });
  };

  // On initial load, restore previous identity from storage
  useEffect(() => {
    void retrieveIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On initial load, check for package version
  useEffect(() => {
    void fetch("/version.json")
      .then((response) => response.json())
      .then((data: { version: string }) => setVersion(data.version));
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
          <h1 className="mt-12 text-center font-sora text-30 font-semibold text-191c20">
            Create your test World ID
          </h1>
          <p className=" text-center text-16 text-657080">
            With the World ID Simulator, you can test different scenarios with
            your identity.
          </p>
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
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-14 text-9ba3ae">
            Version {version}
          </p>
        </div>
      )}
      {isSigning && <Confirm isConfirmed={isConfirmed} />}
    </div>
  );
}
