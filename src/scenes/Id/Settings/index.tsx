import Button from "@/components/Button";
import { CardIcon } from "@/components/CardIcon";
import { Drawer } from "@/components/Drawer";
import { Icon } from "@/components/Icon";
import useIdentity from "@/hooks/useIdentity";
import {
  client,
  core,
  disconnectPairings,
  disconnectSessions,
} from "@/services/walletconnect";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const Settings = React.memo(function Settings(props: {
  open: boolean;
  onClose: () => void;
  commitment: string;
}) {
  const router = useRouter();
  const { id } = router.query;
  const [version, setVersion] = useState("2.0");

  const { clearIdentity } = useIdentity();

  const handleCredentialsMenu = () => {
    void router.push(`/id/${id}/credentials`);
  };

  const handleCopyCommitment = async () => {
    try {
      await navigator.clipboard.writeText(props.commitment);
      toast.success("Copied commitment");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy commitment");
    }
  };

  const handleLogout = async () => {
    // Disconnect all WalletConnect sessions
    if (client) {
      const sessions = client.getActiveSessions();
      const sessionTopics = Object.keys(sessions);
      const pairings = core.pairing.getPairings();
      const pairingTopics = pairings.map((pairing) => pairing.topic);

      try {
        await disconnectSessions(sessionTopics);
        await disconnectPairings(pairingTopics);
        console.info("WalletConnect disconnected");
      } catch (error) {
        console.error(`WalletConnect failed to disconnect, ${error}`);
      }
    }

    // Clear session storage
    clearIdentity();
    console.info("Session storage cleared");

    // Redirect to landing page
    await router.push("/");
  };

  // On initial load, check for package version
  useEffect(() => {
    void fetch("/version.json")
      .then((response) => response.json())
      .then((data: { version: string }) => setVersion(data.version));
  }, []);

  return (
    <Drawer
      fullHeight
      open={props.open}
      onClose={props.onClose}
    >
      <div className="py-1.5 text-center text-h3 font-bold">Settings</div>

      <div className="mt-6 grid gap-y-3">
        <button
          className="grid grid-cols-auto/1fr/auto items-center gap-x-3 rounded-12 bg-gray-50 p-4"
          onClick={handleCredentialsMenu}
        >
          <CardIcon
            className="h-8 w-8"
            name="user"
            color="#9D50FF"
          />

          <div className="grid gap-y-0.5 text-left">
            <div className="text-s3">Credentials</div>
            <div className="text-b4 text-gray-500">Manage your credentials</div>
          </div>

          <Icon
            name="direction-right"
            className="h-6 w-6 text-gray-400"
          />
        </button>

        <button
          className="grid grid-cols-auto/1fr/auto items-center gap-x-3 rounded-12 bg-gray-50 p-4"
          onClick={handleCopyCommitment}
        >
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
        <Button
          className="mb-6 h-14 w-full bg-fff5f7 font-sora text-16 font-semibold text-ff5a76"
          onClick={handleLogout}
        >
          Logout
        </Button>
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-14 text-9ba3ae">
          Version {version}
        </p>
      </div>
    </Drawer>
  );
});
