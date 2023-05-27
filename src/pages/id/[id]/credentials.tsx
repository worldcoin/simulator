import Header from "@/components/Header";
import { Icon } from "@/components/Icon";
import Item from "@/components/Item";
import { VerifyOrb } from "@/components/Verify/VerifyOrb";
import { VerifyPhone } from "@/components/Verify/VerifyPhone";
import useIdentity from "@/hooks/useIdentity";
import { encode } from "@/lib/utils";
import { Chain, type CredentialType } from "@/types";
import type { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function Credentials() {
  const router = useRouter();
  const { identity, retrieveIdentity, updateIdentity } = useIdentity();

  const [isOpenVerifyOrb, setIsOpenVerifyOrb] = useState(false);
  const [isOpenVerifyPhone, setIsOpenVerifyPhone] = useState(false);

  const handleVerifyCredential = async (credentialType: CredentialType) => {
    if (!identity) return;

    const commitment = encode(identity.commitment);
    const init = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chain: identity.chain,
        credentialType,
        commitment,
      }),
    };

    // Check if credentials already exist
    try {
      const response = await fetch("/api/sequencer/inclusionProof", init);
      if (response.ok) {
        toast.info(
          `Credential type '${credentialType.toString()}' already exists onchain!`,
        );
        return;
      }
    } catch (e) {} // Intentionally ignored

    // Insert new credentials via sequencer
    try {
      await fetch("/api/sequencer/insertIdentity", init);
      const zkIdentity = {
        trapdoor: identity.trapdoor,
        nullifier: identity.nullifier,
        commitment: identity.commitment,
      } as ZkIdentity;
      await updateIdentity(zkIdentity, identity.chain, identity.persisted);
    } catch (error) {
      throw new Error(
        `Error verifying '${credentialType.toString()}' credential on chain '${
          identity.chain
        }'`,
      );
    }
  };

  // On initial load, get identity from session storage
  useEffect(() => {
    if (identity) return;
    void retrieveIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col px-2 pb-6 text-center xs:pb-0">
      <Header
        iconLeft="direction-left"
        onClickLeft={() => router.back()}
      />
      <h1 className="mt-10 font-sora text-26 font-semibold text-191c20">
        Obtain your credentials
      </h1>
      <p className="mt-4 font-rubik text-18 text-657080">
        Simulate obtaining different credentials for your World ID.
      </p>
      <Item
        heading="Biometrics"
        text="Obtain the Orb verification on the staging network"
        className="mt-14 p-5"
        onClick={() => setIsOpenVerifyOrb(true)}
      >
        <Icon
          name="orb"
          className="h-5 w-5 text-gray-400"
          bgClassName="h-10 w-10 bg-gray-200 rounded-12"
        />
      </Item>
      {identity?.chain !== Chain.Optimism ? (
        <Item
          heading="Phone number"
          text="Obtain the phone verification on the staging network"
          className="mt-3 p-5"
          onClick={() => setIsOpenVerifyPhone(true)}
        >
          <Icon
            name="phone"
            className="h-5 w-5 text-gray-400"
            bgClassName="h-10 w-10 bg-gray-200 rounded-12"
          />
        </Item>
      ) : (
        <p className="mx-2 mt-6 text-left text-b3 text-gray-400">
          Note: Phone credentials are not currently supported on the Optimism
          network.
        </p>
      )}

      <VerifyOrb
        open={isOpenVerifyOrb}
        onClose={() => setIsOpenVerifyOrb(false)}
        handleVerify={handleVerifyCredential}
      />
      <VerifyPhone
        open={isOpenVerifyPhone}
        onClose={() => setIsOpenVerifyPhone(false)}
        handleVerify={handleVerifyCredential}
      />
    </div>
  );
}
