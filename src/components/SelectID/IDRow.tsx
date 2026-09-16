import { Icon } from "@/components/Icon";
import { Row } from "@/components/Row";
import useIdentity from "@/hooks/useIdentity";
import { credentialsForIdentity } from "@/lib/credentials";
import type { Identity } from "@/types";
import Image from "next/image";
import { useRouter } from "next/router";
import { useMemo } from "react";
import toast from "react-hot-toast";

export default function IDRow(props: {
  identity: Identity;
  active?: boolean;
  divider?: boolean;
}) {
  const router = useRouter();
  const { removeIdentity } = useIdentity();
  const name = props.identity.meta.name;

  const detail = useMemo(() => {
    const credentials = credentialsForIdentity(props.identity);
    if (credentials.length === 0) return "Unverified";
    return credentials.map((credential) => credential.title).join(" · ");
  }, [props.identity]);

  const handleRemove = () => {
    removeIdentity(props.identity.id);
    toast(`Removed ${name}`);
  };

  return (
    <li>
      <Row
        title={name}
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
        actions={
          // Revealed on hover or keyboard focus; always visible where there is no hover.
          <button
            type="button"
            aria-label={`Remove ${name}`}
            onClick={handleRemove}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-fg-tertiary opacity-0 transition-press duration-100 ease-press hover:bg-surface-secondary hover:text-status-error focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-primary/20 active:scale-[0.97] group-hover:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <Icon
              name="trash"
              className="size-5"
            />
          </button>
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
