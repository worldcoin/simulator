import type { Identity } from "@/types";
import { CredentialType } from "@worldcoin/idkit";
import Image from "next/image";
import { useRouter } from "next/router";
import { useMemo } from "react";

export default function IDRow({ identity }: { identity: Identity }) {
  const router = useRouter();
  const iconSource = useMemo(() => `/images/emojis/0.png`, []);
  const verifiedPhone = identity.verified[CredentialType.Phone];
  const verifiedOrb = identity.verified[CredentialType.Orb];
  return (
    <button
      key={identity.id}
      onClick={async () => router.push(`/id/${identity.id}`)}
      className="flex w-full items-center rounded-16 bg-gray-50 p-4 outline-none"
    >
      <div className="flex h-12 w-12 justify-center rounded-full bg-gray-100 align-middle">
        <Image
          width={72}
          height={72}
          className="m-auto h-8 w-8"
          src={iconSource}
          alt="icon"
        />
      </div>
      <div className="ml-3 flex-1 text-left">
        <h3 className="text-s3">{identity.meta.name}</h3>
        <h4 className="mt-1 text-b4 text-gray-500">
          {verifiedOrb && verifiedPhone
            ? "Verified Phone & Orb"
            : verifiedOrb
            ? "Verified Orb"
            : verifiedPhone
            ? "Verified Phone"
            : "Unverified"}
        </h4>
      </div>
    </button>
  );
}
