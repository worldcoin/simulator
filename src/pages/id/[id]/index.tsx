import { IconGradient } from "@/components/Icon/IconGradient";
import Maintenance from "@/components/Maintenance";
import { Modal } from "@/components/Modal";
import { QRInput } from "@/components/QR/QRInput";
import { identityIDToEmoji } from "@/components/SelectID/IDRow";
import { Settings } from "@/components/Settings";
import useIdentity from "@/hooks/useIdentity";
import { checkCache, encode, retryDownload } from "@/lib/utils";
import { parseWorldIDQRCode } from "@/lib/validation";
import { pairClient } from "@/services/walletconnect";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import { CredentialType } from "@worldcoin/idkit";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

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

export default function Id() {
  const router = useRouter();
  const { id } = router.query;
  const { activeIdentity, setActiveIdentityID } = useIdentity();

  useEffect(() => {
    if (id) setActiveIdentityID(id as string);
  }, [id, setActiveIdentityID]);

  const [isOpenScanner, setOpenScanner] = useState(false);
  const [isOpenQRInput, setOpenQRInput] = useState(false);
  const [isOpenSettings, setOpenSettings] = useState(false);

  const performVerification = async (data: string) => {
    const filesInCache = await checkCache();
    if (!filesInCache) await retryDownload();

    const { uri } = parseWorldIDQRCode(data);
    if (activeIdentity && uri) {
      console.log("Performing verification");
      console.log("URI: ", uri);
      console.log("Identity: ", activeIdentity);
      await pairClient(uri);
      console.log("Verification complete");
    }
  };

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
        onClickRight={() => setOpenSettings(true)}
      >
        <DynamicChip />
      </DynamicHeader>

      <DynamicWorldID
        verified={activeIdentity?.verified[CredentialType.Orb]}
        bioVerified={activeIdentity?.verified[CredentialType.Orb]}
        phoneVerified={activeIdentity?.verified[CredentialType.Phone]}
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
          onClick={() => setOpenScanner(true)}
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

      {isOpenScanner && (
        <DynamicQRScanner
          open={isOpenScanner}
          onClose={() => setOpenScanner(false)}
          onClickManualInput={() => setOpenQRInput(true)}
          performVerification={performVerification}
        />
      )}

      <QRInput
        open={isOpenQRInput}
        onClose={() => setOpenQRInput(false)}
        performVerification={performVerification}
      />

      {activeCommitment && (
        <Settings
          open={isOpenSettings}
          onClose={() => setOpenSettings(false)}
          commitment={activeCommitment}
        />
      )}

      <Modal />

      <Maintenance />
    </div>
  );
}
