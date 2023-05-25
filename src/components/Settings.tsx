import Button from "@/components/Button";
import Header from "@/components/Header";
import Item from "@/components/Item";
import useIdentity from "@/hooks/useIdentity";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { client, core } from "@/services/walletconnect";
import { useRouter } from "next/router";
import { memo, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Drawer } from "./Drawer";
import { GradientIcon } from "./GradientIcon";
import { Icon } from "./Icon";

export const Settings = memo(function Settings(props: {
  open: boolean;
  onClose: () => void;
  commitment: string;
}) {
  const router = useRouter();
  const { id } = router.query;
  const [version, setVersion] = useState("2.0");

  const { clearIdentity } = useIdentity();
  const { disconnectSessions, disconnectPairings } = useWalletConnect();

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
    // if (client) {
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
    // }

    // Clear session storage
    clearIdentity();
    console.info("Session storage cleared");

    // Redirect to landing page
    toast.info(`Logged out of identity ${id}`);
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
      <div className="flex h-full flex-col justify-between">
        <div>
          <Header
            heading="Settings"
            iconLeft="chevron-thick"
            onClickLeft={props.onClose}
          />
          <Item
            heading="Credentials"
            text="Manage your credentials"
            className="mt-5 p-4"
            onClick={handleCredentialsMenu}
          >
            <GradientIcon
              name="user"
              color="#9D50FF"
            />
          </Item>
          <Item
            heading="Identity commitment"
            text="Copy your identity commitment"
            className="mt-3 p-4"
            indicator={() => (
              <Icon
                name="copy"
                className="h-6 w-6 text-gray-400"
              />
            )}
            onClick={handleCopyCommitment}
          >
            <GradientIcon
              name="note"
              color="#00C3B6"
            />
          </Item>
        </div>
        <Button
          className="mb-8 h-14 w-full bg-fff5f7 font-sora text-16 font-semibold text-ff5a76"
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
