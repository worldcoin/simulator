import Button from "@/components/Button";
import { Drawer } from "@/components/Drawer";
import { Icon } from "@/components/Icon";
import { NavBarButton } from "@/components/NavBar";
import { Row } from "@/components/Row";
import { IDEmoji } from "@/components/SelectID/IDRow";
import useIdentity from "@/hooks/useIdentity";
import type { UiStore } from "@/stores/ui";
import { useUiStore } from "@/stores/ui";
import { useRouter } from "next/router";
import { memo, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

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
  const { activeIdentity, identities, resetIdentityStore } = useIdentity();

  const close = useCallback(
    () => setSettingsOpened(false),
    [setSettingsOpened],
  );

  const handleCopyCommitment = async () => {
    try {
      await navigator.clipboard.writeText(props.commitment);
      setCopiedCommitment(true);
      toast.success("Copied identity commitment");

      setTimeout(() => setCopiedCommitment(false), 1500);
    } catch (error) {
      console.error(error);
      toast.error("Couldn't copy the commitment");
    }
  };

  const handleSwitchIdentity = async () => {
    close();
    await router.push("/select-id");
  };

  const handleReset = async () => {
    // Clear session storage
    resetIdentityStore();
    console.info("Session storage cleared");

    // Close settings drawer
    close();

    // Redirect to landing page
    toast.success(`Reset simulator, left identity ${id}`);
    await router.push("/select-id");
  };

  // On initial load, check for package version
  useEffect(() => {
    void fetch("/version.json")
      .then((response) => response.json())
      .then((data: { version: string }) => setVersion(data.version));
  }, []);

  const shortCommitment = `${props.commitment.slice(
    0,
    8,
  )}…${props.commitment.slice(-6)}`;

  return (
    <Drawer
      fullHeight
      open={settingsOpened}
      onClose={close}
    >
      <div className="flex h-full flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 text-fg-primary">Settings</h2>
          <NavBarButton
            icon="xmark"
            label="Close settings"
            onClick={close}
          />
        </div>

        {activeIdentity && (
          <div className="flex items-center gap-3 rounded-16 bg-surface-secondary p-4">
            <IDEmoji identityID={activeIdentity.id} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-s1 text-fg-primary">
                {activeIdentity.meta.name}
              </p>
              <p className="text-b3 text-fg-tertiary">Active test identity</p>
            </div>
          </div>
        )}

        <div className="flex flex-col">
          <Row
            icon="person-circle"
            title="Switch test identity"
            detail={`${identities.length} identities available`}
            divider
            onClick={() => void handleSwitchIdentity()}
          />
          <Row
            icon="key"
            title="Identity commitment"
            detail={shortCommitment}
            trailing={
              <Icon
                name={copiedCommitment ? "check" : "copy"}
                className="size-6 text-fg-tertiary"
                label={copiedCommitment ? "Copied" : "Copy"}
              />
            }
            onClick={() => void handleCopyCommitment()}
          />
        </div>

        <div className="mt-auto flex flex-col items-center gap-4">
          <Button
            variant="warning"
            fullWidth
            onClick={() => void handleReset()}
          >
            Reset simulator
          </Button>
          <p className="text-c1 text-fg-tertiary">Version {version}</p>
        </div>
      </div>
    </Drawer>
  );
});
