import { CardIcon } from "@/components/CardIcon";
import { Icon } from "@/components/Icon";
import { WorldID } from "@/components/WorldID";
import useIdentity from "@/hooks/useIdentity";
import { parseWorldIDQRCode } from "@/lib/validation";
import { QrInput } from "@/scenes/Id/QrInput";
import { QrScanner } from "@/scenes/Id/QrScanner";
import { Settings } from "@/scenes/Id/Settings";
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
import { useEffect, useState } from "react";

export function Id() {
  const router = useRouter();
  const { id } = router.query;
  const { identity, retrieveIdentity, encodeIdentityCommitment } =
    useIdentity();

  const handleOnPaste = async (event: React.ClipboardEvent) => {
    const data = event.clipboardData.getData("Text");
    const { uri } = parseWorldIDQRCode(data);

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
      const response = await insertIdentity(commitment, CredentialType.Orb);
    }
  };

  // On initial load, get identity from session storage
  useEffect(() => {
    if (identity) return;
    void retrieveIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isOpenQrInput, setOpenQrInput] = useState(false);
  const [isOpenScanner, setOpenScanner] = useState(false);
  const [isOpenSettings, setOpenSettings] = useState(false);

  return (
    <div className="grid content-between gap-y-6 px-2 pb-6 xs:pb-0">
      <div className="grid grid-cols-auto/1fr/auto gap-4">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200"
          onClick={() => setOpenScanner(true)}
        >
          <Icon
            name="barcode"
            className="h-6 w-6"
          />
        </button>

        <div className="flex items-center justify-center">
          <div className="inline-flex h-8 items-center gap-1 rounded-full bg-info-100 px-3 text-s4 font-medium text-info-700">
            <Icon
              name="user"
              className="h-4 w-4"
            />

            <span className="leading-[1px]">{`${
              identity?.persisted ? "Persistent ID" : "Temporary ID"
            } Simulator`}</span>
          </div>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200"
          onClick={() => setOpenSettings(true)}
        >
          <Icon
            name="setting"
            className="h-6 w-6"
          />
        </button>
      </div>

      <WorldID verified={identity?.verified} />

      <div className="grid grid-cols-2 gap-2">
        <button className="rounded-12 bg-icons-purple-secondary p-4 text-left">
          <CardIcon
            className="h-[44px] w-[44px]"
            name="user"
            color="#9D50FF"
          />

          <div className="mt-4.5 text-s4 font-medium text-icons-purple-primary/60">
            CREDENTIALS
          </div>

          <div className="mt-2 text-s1 font-medium text-icons-purple-primary">
            Verify your identity
          </div>
        </button>

        <button
          className="rounded-12 bg-gray-100 p-4 text-left"
          onClick={() => setOpenQrInput(true)}
        >
          <CardIcon
            className="h-[44px] w-[44px]"
            name="text"
            color="#191C20"
          />

          <div className="mt-4.5 text-s4 font-medium text-gray-900/60">
            SCANNER
          </div>

          <div className="mt-2 text-s1 font-medium text-gray-900">
            Insert QR manually
          </div>
        </button>
      </div>

      <QrInput
        open={isOpenQrInput}
        onClose={() => setOpenQrInput(false)}
      />

      {isOpenScanner && (
        <QrScanner
          open
          onClose={() => setOpenScanner(false)}
        />
      )}

      <Settings
        open={isOpenSettings}
        onClose={() => setOpenSettings(false)}
      />
    </div>
  );
}
