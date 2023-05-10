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
import { useEffect, useState } from "react";
import { WorldID } from "@/components/WorldID";
import { Icon } from "@/components/Icon";
import { CardIcon } from "@/components/CardIcon";
import { Drawer } from "@/components/Drawer";

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

  const [isOpenSettings, setOpenSettings] = useState(false);

  return (
    <div className="grid content-between px-2 pb-6 xs:pb-0">
      <div className="grid grid-cols-auto/1fr/auto gap-4">
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
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

            <span className="leading-[1px]">Temporary ID Simulator</span>
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

      <WorldID />

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

        <button className="rounded-12 bg-gray-100 p-4 text-left">
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

      <Drawer
        open={isOpenSettings}
        onClose={() => setOpenSettings(false)}
      >
        <div className="py-1.5 text-center text-h3 font-bold">Settings</div>

        <div className="mt-6 grid gap-y-3">
          <button className="grid grid-cols-auto/1fr/auto items-center gap-x-3 rounded-12 bg-gray-50 p-4">
            <CardIcon
              className="h-8 w-8"
              name="user"
              color="#9D50FF"
            />

            <div className="grid gap-y-0.5 text-left">
              <div className="text-s3">Credentials</div>
              <div className="text-b4 text-gray-500">
                Manage your credentials
              </div>
            </div>

            <Icon
              name="direction-right"
              className="h-6 w-6 text-gray-400"
            />
          </button>

          <button className="grid grid-cols-auto/1fr/auto items-center gap-x-3 rounded-12 bg-gray-50 p-4">
            <CardIcon
              className="h-8 w-8"
              name="file"
              color="#00C3B6"
            />

            <div className="grid gap-y-0.5 text-left">
              <div className="text-s3">Identity commitment</div>
              <div className="text-b4 text-gray-500">
                Copy your ID commitment number
              </div>
            </div>

            <Icon
              name="copy"
              className="h-6 w-6 text-gray-400"
            />
          </button>
        </div>
      </Drawer>
    </div>
  );
}
