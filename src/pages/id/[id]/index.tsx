import { IconGradient } from "@/components/Icon/IconGradient";
import Maintenance from "@/components/Maintenance";
import { Modal } from "@/components/Modal";
import { QRInput } from "@/components/QR/QRInput";
import { identityIDToEmoji } from "@/components/SelectID/IDRow";
import { Settings } from "@/components/Settings";
import useIdentity from "@/hooks/useIdentity";
import { checkCache, encode, retryDownload } from "@/lib/utils";
import { pairClient } from "@/services/bridge";
import type { ModalStore } from "@/stores/modalStore";
import { useModalStore } from "@/stores/modalStore";
import { useUiStore, type UiStore } from "@/stores/ui";
import { Errors, Status } from "@/types";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import { CredentialType } from "@worldcoin/idkit-core";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo } from "react";

const DynamicChip = dynamic(() => import("@/components/Chip"), {
  ssr: false,
});
const DynamicWorldID = dynamic(() => import("@/components/WorldID"), {
  ssr: false,
});
const DynamicQRScanner = dynamic(() => import("@/components/QR/QRScanner"), {
  ssr: false,
});
const DynamicHeader = dynamic(() => import("@/components/Header"), {
  ssr: false,
});

const getStore = (store: ModalStore) => ({
  setBridgeInitialData: store.setBridgeInitialData,
  setMetadata: store.setMetadata,
  setOpen: store.setOpen,
  setStatus: store.setStatus,
  setErrorCode: store.setErrorCode,
  setUrl: store.setUrl,
});

const getUiStore = (store: UiStore) => ({
  scannerOpened: store.scannerOpened,
  setScannerOpened: store.setScannerOpened,
  setSettingsOpened: store.setSettingsOpened,
});

export default function Id() {
  const router = useRouter();
  const { id } = router.query;
  const { activeIdentity, setActiveIdentityID } = useIdentity();

  const {
    setOpen,
    setStatus,
    setErrorCode,
    setUrl,
    setBridgeInitialData,
    setMetadata,
  } = useModalStore(getStore);

  const { scannerOpened, setScannerOpened, setSettingsOpened } =
    useUiStore(getUiStore);

  useEffect(() => {
    if (id) setActiveIdentityID(id as string);
  }, [id, setActiveIdentityID]);

  const performVerification = useCallback(
    async (url: string) => {
      setOpen(true);
      const filesInCache = await checkCache();
      if (!filesInCache) await retryDownload();

      if (!activeIdentity) {
        return console.error("No active identity");
      }

      const pairingResult = await pairClient({ url });

      if (!pairingResult.success) {
        setStatus(Status.Error);
        if (pairingResult.error.code == Errors.InputError) {
          setErrorCode(Errors.InputError);
        }
        return console.error(pairingResult.error);
      }

      const { metadata, bridgeInitialData } = pairingResult;

      setUrl(url);
      setBridgeInitialData(bridgeInitialData);
      setMetadata(metadata);
      setStatus(Status.Waiting);
    },
    [
      activeIdentity,
      setBridgeInitialData,
      setMetadata,
      setOpen,
      setStatus,
      setUrl,
    ],
  );

  const activeCommitment = useMemo(() => {
    const zkIdentityStr = activeIdentity?.zkIdentity;
    if (!zkIdentityStr) return null;
    const zkIdentity = new ZkIdentity(zkIdentityStr);
    return encode(zkIdentity.commitment);
  }, [activeIdentity]);

  const userIconSrc = useMemo(
    () => (activeIdentity ? identityIDToEmoji(activeIdentity.id) : undefined),
    [activeIdentity],
  );

  return (
    <div className="flex flex-col gap-y-4 px-2 pb-4 xs:gap-y-6 xs:pb-6">
      <DynamicHeader
        iconLeft="user"
        imgLeft={userIconSrc}
        iconRight="setting"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClickLeft={async () => router.push("/select-id")}
        onClickRight={() => setSettingsOpened(true)}
      >
        <DynamicChip />
      </DynamicHeader>

      <DynamicWorldID
        verified={activeIdentity?.verified[CredentialType.Orb]}
        bioVerified={activeIdentity?.verified[CredentialType.Orb]}
        phoneVerified={activeIdentity?.verified[CredentialType.Device]}
      />

      <div className="grid grid-cols-1 gap-2">
        {/* <button
          className="rounded-12 bg-gray-100 p-4 text-left"
          onClick={handleCredentialsCard}
        >
          <IconGradient
            name="user"
            color="#191C20"
            className="h-6 w-6 text-white"
            bgClassName="h-[44px] w-[44px]"
          />

          <div className="mt-4.5 text-s4 font-medium text-gray-900/60">
            CREDENTIALS
          </div>

          <div className="mt-2 text-s1 font-medium text-gray-900">
            Verify your identity
          </div>
        </button> */}

        <button
          className="rounded-12 bg-gray-100 p-4 text-left"
          onClick={() => setScannerOpened(true)}
        >
          <IconGradient
            name="qr-code"
            color="#191C20"
            className="h-6 w-6 text-white"
            bgClassName="h-[44px] w-[44px]"
          />

          <div className="mt-4.5 text-s4 font-medium text-gray-900/60">
            SCANNER
          </div>

          <div className="mt-1 text-s1 font-medium text-gray-900">
            Scan QR or Paste data
          </div>
        </button>
      </div>

      {scannerOpened && (
        <DynamicQRScanner performVerification={performVerification} />
      )}

      <QRInput performVerification={performVerification} />
      {activeCommitment && <Settings commitment={activeCommitment} />}
      <Modal />
      <Maintenance />
    </div>
  );
}
