import Header from "@/components/Header";
import VerifyItem from "@/components/Verify/VerifyItem";
import { VerifyOrb } from "@/components/Verify/VerifyOrb";
import { VerifyPhone } from "@/components/Verify/VerifyPhone";
import useIdentity from "@/hooks/useIdentity";
import { encode } from "@/lib/utils";
import { Chain, CredentialType } from "@/types";
import { Identity as ZKIdentity } from "@semaphore-protocol/identity";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Credentials() {
  const router = useRouter();
  const { activeIdentity, generateIdentityProofsIfNeeded } = useIdentity();

  const [isOpenVerifyOrb, setIsOpenVerifyOrb] = useState(false);
  const [isOpenVerifyPhone, setIsOpenVerifyPhone] = useState(false);

  const handleVerifyCredential = async (credentialType: CredentialType) => {
    if (!activeIdentity) return;
    const zkIdentityStr = activeIdentity.zkIdentity;
    const zkIdentity = new ZKIdentity(zkIdentityStr);

    const commitment = encode(zkIdentity.commitment);

    const chains =
      credentialType == CredentialType.Orb ? [Chain.Polygon] : [Chain.Polygon];
    const pairs = chains.map((chain) => ({ chain, credentialType }));

    const inclusionRequests = pairs.map(async ({ chain, credentialType }) => {
      const init = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain,
          credentialType,
          commitment,
        }),
      };
      return await fetch("/api/sequencer/inclusionProof", init);
    });

    // Check if credentials already exist
    try {
      const responses = await Promise.all(inclusionRequests);
      const responses200 = responses.filter(
        (response) => response.status === 200,
      );
      if (responses200.length > 0) {
        toast.error(
          `Credential type '${credentialType.toString()}' already exists onchain!`,
        );
        return;
      }
    } catch (e) {} // Intentionally ignored

    // Insert new credentials via sequencer
    const requestsInsert = pairs.map(async ({ chain, credentialType }) => {
      const init = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain,
          credentialType,
          commitment,
        }),
      };
      return await fetch("/api/sequencer/insertIdentity", init);
    });

    try {
      await Promise.all(requestsInsert);
      await generateIdentityProofsIfNeeded(activeIdentity);
    } catch (error) {
      throw new Error(
        `Error verifying '${credentialType.toString()}' error: ${error}`,
      );
    }
  };

  return (
    <div className="flex flex-col px-2 pb-6 text-center xs:pb-0">
      <Header
        iconLeft="direction-left"
        onClickLeft={() => router.back()}
      />
      <h1 className="mt-10 font-sora text-26 font-semibold text-gray-900">
        Obtain your credentials
      </h1>
      <p className="mt-4 font-rubik text-18 text-gray-500">
        Simulate obtaining different credentials for your World ID.
      </p>
      <VerifyItem
        heading="Biometrics"
        text="Obtain the Orb verification on the staging network"
        icon="orb"
        color="#9D50FF"
        className="mt-14 p-5"
        verified={activeIdentity?.verified[CredentialType.Orb]}
        onClick={() => setIsOpenVerifyOrb(true)}
      />

      <VerifyItem
        heading="Phone"
        text="Obtain the phone verification on the staging network"
        icon="phone"
        color="#00C313"
        className="mt-3 p-5"
        verified={activeIdentity?.verified[CredentialType.Phone]}
        onClick={() => setIsOpenVerifyPhone(true)}
      />

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
