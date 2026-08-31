import { Icon } from "@/components/Icon";
import { formatV4PersonaSummary } from "@/lib/identity-persona";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui";
import type { Identity } from "@/types";
import { VerificationLevel } from "@worldcoin/idkit-core";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";

export default function IDRow({ identity }: { identity: Identity }) {
  const router = useRouter();
  const setSettingsOpened = useUiStore((store) => store.setSettingsOpened);

  const openIdentity = useCallback(async () => {
    await router.push(`/id/${identity.id}`);
  }, [identity.id, router]);

  const editIdentity = useCallback(async () => {
    setSettingsOpened(true);
    await router.push(`/id/${identity.id}`);
  }, [identity.id, router, setSettingsOpened]);

  // Check verification status for all levels
  const verifiedLevels = Object.entries(identity.verified)
    .filter(([_, isVerified]) => isVerified)
    .map(([level]) => level);

  const isVerified = verifiedLevels.length > 0;

  // Format the verification text
  const getVerificationText = () => {
    if (!isVerified) return "Unverified";

    if (verifiedLevels.length === Object.keys(VerificationLevel).length) {
      return "Verified (All)";
    }

    // Map verification level enum keys to readable names
    const levelNames = verifiedLevels.map((level) => {
      switch (level) {
        case VerificationLevel.Orb:
          return "Orb";
        case VerificationLevel.Device:
          return "Device";
        case VerificationLevel.SecureDocument:
          return "Secure Document";
        case VerificationLevel.Document:
          return "Document";
        default:
          return level;
      }
    });

    return `Verified (${levelNames.join(", ")})`;
  };

  return (
    <div className="flex w-full items-center rounded-16 bg-gray-50 p-4">
      <button
        type="button"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={openIdentity}
        className="flex min-w-0 flex-1 items-center text-left outline-none"
      >
        <IDEmoji identityID={identity.id} />
        <div className="ml-3 min-w-0 flex-1">
          <h3 className="text-s3">{identity.meta.name}</h3>
          <div
            className={cn(
              "inline-flex h-full items-center gap-x-1 align-middle",
              { "text-info-700": isVerified },
              { "text-gray-500": !isVerified },
            )}
          >
            <Icon
              name={isVerified ? "badge-verified" : "badge-not-verified"}
              className={"size-3 "}
            />
            <h4 className="text-b4 text-gray-500">{getVerificationText()}</h4>
          </div>
          <p className="mt-1 truncate text-b4 text-gray-500">
            {formatV4PersonaSummary(identity)}
          </p>
        </div>
      </button>
      <button
        type="button"
        aria-label={`Edit ${identity.meta.name} persona`}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={editIdentity}
        className="ml-3 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-100 bg-white text-gray-500 outline-none"
      >
        <Icon
          name="setting"
          className="size-5"
        />
      </button>
    </div>
  );
}

export function identityIDToEmoji(identityID: string) {
  const intID = parseInt(identityID, 16);
  return `/images/emojis/${intID % 32}.png`;
}

function IDEmoji({ identityID }: { identityID: string }) {
  const iconSource = useMemo(() => identityIDToEmoji(identityID), [identityID]);
  return (
    <div className="flex size-12 shrink-0 justify-center rounded-full bg-gray-100 align-middle">
      <Image
        width={72}
        height={72}
        className="m-auto size-8"
        src={iconSource}
        alt="icon"
      />
    </div>
  );
}
