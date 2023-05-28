import Header from "@/components/Header";
import { Icon } from "@/components/Icon";
import { IconGradient } from "@/components/Icon/IconGradient";
import { Modal } from "@/components/Modal";
import { QRInput } from "@/components/QR/QRInput";
import { QRScanner } from "@/components/QR/QRScanner";
import { Settings } from "@/components/Settings";
import { WorldID } from "@/components/WorldID";
import useIdentity from "@/hooks/useIdentity";
import { encode } from "@/lib/utils";
import { parseWorldIDQRCode } from "@/lib/validation";
import { pairClient } from "@/services/walletconnect";
import { CredentialType } from "@worldcoin/idkit";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Id() {
  const router = useRouter();
  const { id } = router.query;
  const { identity, retrieveIdentity } = useIdentity();

  const [isOpenScanner, setOpenScanner] = useState(false);
  const [isOpenQRInput, setOpenQRInput] = useState(false);
  const [isOpenSettings, setOpenSettings] = useState(false);

  const handleCredentialsCard = () => {
    void router.push(`/id/${id}/credentials`);
  };

  const performVerification = async (data: string) => {
    const { uri } = parseWorldIDQRCode(data);
    if (identity && uri) {
      await pairClient(uri);
    }
  };

  // On initial load, get identity from session storage
  useEffect(() => {
    if (identity) return;
    void retrieveIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-y-4 px-2 pb-4 xs:gap-y-6 xs:pb-6">
      <Header
        iconLeft="barcode"
        iconRight="setting"
        onClickLeft={() => setOpenScanner(true)}
        onClickRight={() => setOpenSettings(true)}
      >
        <div className="flex h-8 items-center gap-1 rounded-full bg-info-100 px-3 text-s4 font-medium text-info-700">
          <Icon
            name="user"
            className="h-4 w-4"
          />

          <span className="leading-[1px]">
            {identity?.persisted ? "Persistent" : "Temporary"}
          </span>
        </div>
      </Header>

      <WorldID
        verified={identity?.verified[CredentialType.Orb]}
        bioVerified={identity?.verified[CredentialType.Orb]}
        phoneVerified={identity?.verified[CredentialType.Phone]}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          className="rounded-12 bg-icons-purple-secondary p-4 text-left"
          onClick={handleCredentialsCard}
        >
          <IconGradient
            name="user"
            color="#9D50FF"
            className="h-6 w-6 text-gray-0"
            bgClassName="h-[44px] w-[44px]"
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
          onClick={() => setOpenQRInput(true)}
        >
          <IconGradient
            name="text"
            color="#191C20"
            className="h-6 w-6 text-gray-0"
            bgClassName="h-[44px] w-[44px]"
          />

          <div className="mt-4.5 text-s4 font-medium text-gray-900/60">
            SCANNER
          </div>

          <div className="mt-2 text-s1 font-medium text-gray-900">
            Insert QR manually
          </div>
        </button>
      </div>

      {isOpenScanner && (
        <QRScanner
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

      {identity && (
        <Settings
          open={isOpenSettings}
          onClose={() => setOpenSettings(false)}
          commitment={encode(identity.zkIdentity.commitment)}
        />
      )}

      <Modal />
    </div>
  );
}
