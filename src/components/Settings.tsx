import Header from "@/components/Header";
import Item from "@/components/Item";
import useIdentity from "@/hooks/useIdentity";
import type { UiStore } from "@/stores/ui";
import { useUiStore } from "@/stores/ui";
import { useRouter } from "next/router";
import { memo, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "./Button";
import { Drawer } from "./Drawer";
import { Icon } from "./Icon";
import { IconGradient } from "./Icon/IconGradient";

const getUiStore = (store: UiStore) => ({
  settingsOpened: store.settingsOpened,
  setSettingsOpened: store.setSettingsOpened,
});

export const Settings = memo(function Settings(props: { commitment: string }) {
  const { settingsOpened, setSettingsOpened } = useUiStore(getUiStore);
  const router = useRouter();
  const { id } = router.query;
  const [version, setVersion] = useState("2.0");
  const [copiedCommitment, setCopiedCommitment] = useState(false);
  const { resetIdentityStore } = useIdentity();

  const close = useCallback(
    () => setSettingsOpened(false),
    [setSettingsOpened],
  );

  const handleCopyCommitment = async () => {
    try {
      await navigator.clipboard.writeText(props.commitment);
      setCopiedCommitment(true);
      toast.success("Copied commitment");

      setTimeout(() => setCopiedCommitment(false), 500);
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy commitment");
    }
  };

  const handleLogout = async () => {
    // Clear session storage
    resetIdentityStore();
    console.info("Session storage cleared");

    // Close settings drawer
    close();

    // Redirect to landing page
    toast.success(`Logged out of identity ${id}`);
    await router.push("/select-id");
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
      open={settingsOpened}
      onClose={close}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <Header
            heading="Settings"
            iconLeft="chevron-thick"
            onClickLeft={close}
          />
          <Item
            heading="Identity commitment"
            text="Copy your identity commitment"
            className="mt-3 p-4"
            indicator={() => (
              <Icon
                name={copiedCommitment ? "check" : "copy"}
                className="h-6 w-6 text-gray-400"
              />
            )}
            onClick={() => void handleCopyCommitment()}
          >
            <IconGradient
              name="note"
              color="#00C3B6"
            />
          </Item>
        </div>
        <Button
          className="mb-8 h-14 w-full bg-error-100 font-sora text-16 font-semibold text-error-700"
          onClick={() => {
            void handleLogout();
          }}
        >
          Reset Simulator
        </Button>
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-14 text-gray-400">
          Version {version}
        </p>
      </div>
    </Drawer>
  );
});
