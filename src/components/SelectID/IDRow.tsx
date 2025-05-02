import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";
import type { Identity } from "@/types";
import { VerificationLevel } from "@worldcoin/idkit-core";
import Image from "next/image";
import { useRouter } from "next/router";
import { useMemo } from "react";

export default function IDRow({ identity }: { identity: Identity }) {
  const router = useRouter();

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
    <button
      key={identity.id}
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onClick={async () => router.push(`/id/${identity.id}`)}
      className="flex w-full items-center rounded-16 bg-gray-50 p-4 outline-none"
    >
      <IDEmoji identityID={identity.id} />
      <div className="ml-3 flex-1 text-left">
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
            className={"h-3 w-3 "}
          />
          <h4 className="text-b4 text-gray-500">{getVerificationText()}</h4>
        </div>
      </div>
    </button>
  );
}

export function identityIDToEmoji(identityID: string) {
  const intID = parseInt(identityID, 16);
  return `/images/emojis/${intID % 32}.png`;
}

function IDEmoji({ identityID }: { identityID: string }) {
  const iconSource = useMemo(() => identityIDToEmoji(identityID), [identityID]);
  return (
    <div className="flex h-12 w-12 justify-center rounded-full bg-gray-100 align-middle">
      <Image
        width={72}
        height={72}
        className="m-auto h-8 w-8"
        src={iconSource}
        alt="icon"
      />
    </div>
  );
}
