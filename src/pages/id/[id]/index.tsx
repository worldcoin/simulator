import useIdentity from "@/hooks/useIdentity";
import { parseWorldIDQRCode } from "@/lib/validation";
import { insertIdentity } from "@/services/sequencer";
import {
  client,
  createClient,
  disconnectSessions,
  onSessionDisconnect,
  onSessionProposal,
  onSessionRequest,
  pairClient,
} from "@/services/walletconnect";
import { CredentialType } from "@/types";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Id() {
  const router = useRouter();
  const { id } = router.query;
  const { identity, retrieveIdentity, encodeIdentityCommitment } =
    useIdentity();

  const handleOnPaste = async (event: React.ClipboardEvent) => {
    const data = event.clipboardData.getData("Text");
    const { uri, valid } = parseWorldIDQRCode(data);

    if (identity) {
      await createClient(identity);

      client.on("session_proposal", onSessionProposal);
      client.on("session_request", onSessionRequest);
      client.on("session_delete", onSessionDisconnect);

      if (uri) {
        await pairClient(uri);
      }
    }

    return {};
  };

  const handleDisconnect = async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (client) {
      const sessions = client.getActiveSessions();
      const topics = Object.keys(sessions);

      topics.forEach(async (topic: string) => {
        await disconnectSessions([topic]);
      });
    }
  };

  const handleInsert = async () => {
    if (identity) {
      const commitment = encodeIdentityCommitment(identity.commitment);
      console.log(
        "🚀 ~ file: index.tsx:57 ~ handleInsert ~ commitment:",
        commitment,
      );
      const response = await insertIdentity(commitment, CredentialType.Orb);
      console.log(
        "🚀 ~ file: index.tsx:59 ~ handleInsert ~ response:",
        response,
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
    <div className="flex flex-col px-2 pb-6 xs:pb-0">
      {identity && (
        <>
          <p className="text-000000">Identity: {id}</p>
          <p className=" text-000000">
            Commitment: {encodeIdentityCommitment(identity.commitment)}
          </p>
          <p className="overflow-hidden text-000000">
            Nullifier: {encodeIdentityCommitment(identity.nullifier)}
          </p>
          <p className="text-000000">
            Inclusion Proof: {identity.inclusionProof?.toString()}
          </p>
          <input
            className="mt-2 w-full border-2 border-000000 p-2 text-000000"
            type="text"
            placeholder="World ID URI"
            onPaste={handleOnPaste}
          />
          <button
            className="w-full bg-000000"
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
          <button
            className="w-full bg-4940e0"
            onClick={handleInsert}
          >
            Insert Identity
          </button>
        </>
      )}
    </div>
  );
}
