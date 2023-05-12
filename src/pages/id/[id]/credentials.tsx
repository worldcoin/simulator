import Item from "@/components/Item";
import useIdentity from "@/hooks/useIdentity";
import { inclusionProof, insertIdentity } from "@/services/sequencer";
import type { InclusionProofResponse } from "@/types";
import { CredentialType } from "@/types";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function Credentials() {
  const router = useRouter();
  const { identity, retrieveIdentity, encodeIdentityCommitment } =
    useIdentity();

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
        toast.info(`${credentialType.toString()} credential already exists!`);
        await router.push(`/id/${identity.id}`);
      } catch (e) {}

      if (!proof) {
        try {
          await insertIdentity(identity.chain, credentialType, commitment);
          toast.success(
            `${credentialType.toString()} credential is being verified!`,
          );
          await router.push(`/id/${identity.id}`);
        } catch (error) {
          console.error(error);
          toast.error(
            `Error verifying ${credentialType.toString()} credential`,
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
        World ID credentials
      </h1>
      <p className="mt-4 font-rubik text-18 text-657080">
        Simulate and manage different verified credentials for your World ID.
      </p>
      <Item
        icon="orb"
        heading="Biometrics"
        text="Verify with a simulation of the Worldcoin Orb"
        className="mt-14 p-5"
        onClick={() => handleVerifyCredential(CredentialType.Orb)}
      />
      <Item
        icon="phone"
        heading="Phone number"
        text="Verify with a randomly generated phone number"
        className="mt-3 p-5"
        onClick={() => handleVerifyCredential(CredentialType.Phone)}
      />
      {/* <Switch /> */}
    </div>
  );
}
