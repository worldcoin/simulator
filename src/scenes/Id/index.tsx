import { CardIcon } from "@/components/CardIcon";
import { Icon } from "@/components/Icon";
import { WorldID } from "@/components/WorldID";
import useIdentity from "@/hooks/useIdentity";
import { QrInput } from "@/scenes/Id/QrInput";
import { Scanner } from "@/scenes/Id/Scanner";
import { Settings } from "@/scenes/Id/Settings";
// import { Settings } from "@/components/Settings";
import { CredentialType } from "@/types";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export function Id() {
  const router = useRouter();
  const { id } = router.query;
  const { identity, retrieveIdentity, encodeIdentityCommitment } =
    useIdentity();

  const [isOpenQrInput, setOpenQrInput] = useState(false);
  const [isOpenScanner, setOpenScanner] = useState(false);
  const [isOpenSettings, setOpenSettings] = useState(false);

  const handleCredentialsCard = () => {
    void router.push(`/id/${id}/credentials`);
  };

  // On initial load, get identity from session storage
  useEffect(() => {
    if (identity) return;
    void retrieveIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

            <span className="leading-[1px]">
              {identity?.persisted ? "Persistent ID" : "Temporary ID"}
            </span>
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

      <WorldID verified={identity?.verified[CredentialType.Orb]} />

      <div className="grid grid-cols-2 gap-2">
        <button
          className="rounded-12 bg-icons-purple-secondary p-4 text-left"
          onClick={handleCredentialsCard}
        >
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

      <Scanner
        open={isOpenScanner}
        onClose={() => setOpenScanner(false)}
      />

      {identity && (
        <Settings
          open={isOpenSettings}
          onClose={() => setOpenSettings(false)}
          commitment={encodeIdentityCommitment(identity.commitment)}
        />
      )}
    </div>
  );
}
