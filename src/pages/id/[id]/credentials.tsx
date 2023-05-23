import { Icon } from "@/components/Icon";
import Item from "@/components/Item";
import { VerifyOrb } from "@/components/VerifyOrb";
import { VerifyPhone } from "@/components/VerifyPhone";
import useIdentity from "@/hooks/useIdentity";
import { inclusionProof, insertIdentity } from "@/services/sequencer";
import type { CredentialType, InclusionProofResponse } from "@/types";
import { useEffect, useState } from "react";

export default function Credentials() {
  const { identity, retrieveIdentity, encodeIdentityCommitment } =
    useIdentity();

  const [isOpenVerifyOrb, setIsOpenVerifyOrb] = useState(false);
  const [isOpenVerifyPhone, setIsOpenVerifyPhone] = useState(false);

  const handleVerifyCredential = async (credentialType: CredentialType) => {
    if (identity) {
      const commitment = encodeIdentityCommitment(identity.commitment);
      let proof: InclusionProofResponse | undefined;
      try {
        proof = await inclusionProof(
          identity.chain,
          credentialType,
          commitment,
        );
      } catch (e) {}

      if (!proof) {
        try {
          await insertIdentity(identity.chain, credentialType, commitment);
        } catch (error) {
          throw new Error(
            `Error verifying ${credentialType.toString()} credential on chain ${
              identity.chain
            }`,
          );
        }
      }
    }
  };

  // On initial load, get identity from session storage
  useEffect(() => {
    if (identity) return;
    void retrieveIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-12 flex flex-col px-2 pb-6 text-center xs:pb-0">
      <h1 className="font-sora text-26 font-semibold text-191c20">
        Obtain your credentials
      </h1>
      <p className="mt-4 font-rubik text-18 text-657080">
        Simulate obtaining different credentials for your World ID.
      </p>
      <Item
        heading="Biometrics"
        text="Obtain the Orb verifcation on the staging network"
        className="mt-14 p-5"
        onClick={() => setIsOpenVerifyOrb(true)}
      >
        <Icon
          name="orb"
          className="h-5 w-5 text-gray-400"
          bgClassName="h-10 w-10 bg-gray-200 rounded-12"
        />
      </Item>
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
