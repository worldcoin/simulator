import Button from "@/components/Button";
import type { IconType } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * World App navigation bar in large-title mode: a 44pt toolbar row with round
 * icon buttons, and the title set in `h2` underneath it.
 */
export function NavBar(props: {
  title?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-3", props.className)}>
      <div className="flex h-11 items-center justify-between">
        <div className="flex items-center gap-2">{props.leading}</div>
        <div className="flex items-center gap-2">{props.trailing}</div>
      </div>
      {props.title && (
        <h1 className="text-h2 text-fg-primary">{props.title}</h1>
      )}
    </header>
  );
}

/** Round 44pt toolbar button. Pass an `icon`, or children such as an avatar. */
export function NavBarButton(props: {
  icon?: IconType;
  label: string;
  onClick: () => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Button
      variant="tertiary"
      size={44}
      iconOnly
      aria-label={props.label}
      onClick={props.onClick}
      className={cn("overflow-hidden", props.className)}
    >
      {props.children ??
        (props.icon && (
          <Icon
            name={props.icon}
            className="size-6"
          />
        ))}
    </Button>
  );
}
