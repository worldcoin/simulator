import { Icon } from "@/components/Icon";
import { Row } from "@/components/Row";
import { credentialsForIdentity } from "@/lib/credentials";
import type { Identity } from "@/types";
import Image from "next/image";
import { useRouter } from "next/router";
import { useMemo } from "react";

export default function IDRow(props: {
  identity: Identity;
  active?: boolean;
  divider?: boolean;
}) {
  const router = useRouter();

  const detail = useMemo(() => {
    const credentials = credentialsForIdentity(props.identity);
    if (credentials.length === 0) return "Unverified";
    return credentials.map((credential) => credential.title).join(" · ");
  }, [props.identity]);

  return (
    <li>
      <Row
        title={props.identity.meta.name}
        detail={detail}
        leading={<IDEmoji identityID={props.identity.id} />}
        divider={props.divider}
        trailing={
          props.active ? (
            <Icon
              name="check-circle-solid"
              className="size-6 text-fg-primary"
              label="Active identity"
            />
          ) : undefined
        }
        onClick={() => void router.push(`/id/${props.identity.id}`)}
      />
    </li>
  );
}

export function identityIDToEmoji(identityID: string) {
  const intID = parseInt(identityID, 16);
  return `/images/emojis/${intID % 32}.png`;
}

export function IDEmoji(props: { identityID: string; className?: string }) {
  const iconSource = useMemo(
    () => identityIDToEmoji(props.identityID),
    [props.identityID],
  );

  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-secondary">
      <Image
        width={72}
        height={72}
        className="size-6"
        src={iconSource}
        alt=""
      />
    </span>
  );
}
