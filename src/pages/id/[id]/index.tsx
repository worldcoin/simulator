import Button from "@/components/Button";
import { CredentialDetails } from "@/components/Credentials/CredentialDetails";
import { CredentialStack } from "@/components/Credentials/CredentialStack";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { WORLD_ID_ART } from "@/lib/assets";
import { NavBar, NavBarButton } from "@/components/NavBar";
import { QRInput } from "@/components/QR/QRInput";
import { identityIDToEmoji } from "@/components/SelectID/IDRow";
import { Settings } from "@/components/Settings";
import useIdentity from "@/hooks/useIdentity";
import {
  CONNECT_URL_QUERY_KEY,
  isValidConnectUrl,
  readSingleQueryValue,
} from "@/lib/connect-url";
import type { CredentialKind } from "@/lib/credentials";
import { credentialsForIdentity } from "@/lib/credentials";
import { checkCache, encode, retryDownload } from "@/lib/utils";
import { pairClient } from "@/services/bridge";
import type { ModalStore } from "@/stores/modalStore";
import { useModalStore } from "@/stores/modalStore";
import { useUiStore, type UiStore } from "@/stores/ui";
import { ErrorsCode, Status } from "@/types";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const DynamicQRScanner = dynamic(() => import("@/components/QR/QRScanner"), {
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
  setQrInputOpened: store.setQrInputOpened,
});

export default function Id() {
  const router = useRouter();
  const { id } = router.query;
  const { activeIdentity, setActiveIdentityID } = useIdentity();
  const consumedConnectUrlRef = useRef<string | null>(null);
  const [focused, setFocused] = useState<CredentialKind | null>(null);

  const {
    setOpen,
    setStatus,
    setErrorCode,
    setUrl,
    setBridgeInitialData,
    setMetadata,
  } = useModalStore(getStore);

  const {
    scannerOpened,
    setScannerOpened,
    setSettingsOpened,
    setQrInputOpened,
  } = useUiStore(getUiStore);

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
        if (
          pairingResult.error.code == ErrorsCode.InputError ||
          pairingResult.error.code == ErrorsCode.MissingAction ||
          pairingResult.error.code == ErrorsCode.AppNotRegisteredV4
        ) {
          setErrorCode(pairingResult.error.code);
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
      setErrorCode,
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

  const credentials = useMemo(
    () => credentialsForIdentity(activeIdentity),
    [activeIdentity],
  );

  const focusedCredential = useMemo(
    () => credentials.find((credential) => credential.kind === focused) ?? null,
    [credentials, focused],
  );

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof id !== "string") return;
    if (!activeIdentity || activeIdentity.id !== id) return;

    const connectUrl = readSingleQueryValue(
      router.query[CONNECT_URL_QUERY_KEY],
    );

    if (!connectUrl) {
      consumedConnectUrlRef.current = null;
      return;
    }

    const connectUrlValue = connectUrl;

    if (consumedConnectUrlRef.current === connectUrlValue) return;
    consumedConnectUrlRef.current = connectUrlValue;

    async function consumeConnectUrl() {
      try {
        const valid = await isValidConnectUrl(connectUrlValue);
        if (!valid) {
          toast.error("Invalid connection URL");
          return;
        }

        await performVerification(connectUrlValue);
      } finally {
        await router.replace(
          { pathname: "/id/[id]", query: { id } },
          `/id/${id}`,
          { shallow: true },
        );
      }
    }

    void consumeConnectUrl();
  }, [activeIdentity, id, performVerification, router]);

  return (
    <div className="flex min-h-0 flex-col gap-6 overflow-y-auto px-2 pb-6 scrollbar-hidden">
      <NavBar
        title={focusedCredential ? undefined : "Credentials"}
        leading={
          focusedCredential && (
            <NavBarButton
              icon="xmark"
              label="Close credential"
              onClick={() => setFocused(null)}
            />
          )
        }
        trailing={
          !focusedCredential && (
            <>
              <NavBarButton
                icon="qr-code"
                label="Scan QR code"
                onClick={() => setScannerOpened(true)}
              />
              <NavBarButton
                label="Settings"
                onClick={() => setSettingsOpened(true)}
              >
                {userIconSrc ? (
                  <Image
                    width={72}
                    height={72}
                    src={userIconSrc}
                    className="size-7"
                    alt=""
                  />
                ) : (
                  <Icon
                    name="person-circle"
                    className="size-6"
                  />
                )}
              </NavBarButton>
            </>
          )
        }
      />

      {credentials.length > 0 ? (
        <CredentialStack
          credentials={credentials}
          focused={focused}
          onFocus={setFocused}
        />
      ) : (
        <div className="flex flex-col gap-3 rounded-16 bg-grey-950 p-6 text-white">
          <Image
            src={WORLD_ID_ART.orbFront}
            alt=""
            width={56}
            height={56}
            className="size-14"
          />
          <p className="text-h4">Prove you&apos;re human, fully privately</p>
          <p className="text-b2 text-grey-500">
            This test identity has no verified credentials yet.
          </p>
        </div>
      )}

      <AnimatePresence
        mode="wait"
        initial={false}
      >
        {focusedCredential ? (
          <CredentialDetails
            key={focusedCredential.kind}
            credential={focusedCredential}
          />
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex justify-center"
          >
            <div className="flex justify-center">
              <Button
                variant="secondary"
                size={40}
                onClick={() => setQrInputOpened(true)}
              >
                <Icon
                  name="text"
                  className="size-5"
                />
                Paste code
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {scannerOpened && (
        <DynamicQRScanner performVerification={performVerification} />
      )}

      <QRInput performVerification={performVerification} />
      {activeCommitment && <Settings commitment={activeCommitment} />}
      <Modal />
    </div>
  );
}
