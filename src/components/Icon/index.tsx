import { cn } from "@/lib/utils";
import React from "react";
import styles from "./Icon.module.css";
import { NUCLEUS_ICONS, type NucleusIconName } from "./nucleus";

/** Glyphs Nucleus does not ship: the fake iOS status bar, the spinner and the World logo. */
const legacyIcons = [
  "battery",
  "camera-off",
  "logo",
  "network",
  "spinner",
  "wifi",
] as const;

type LegacyIconName = (typeof legacyIcons)[number];

export type IconType = LegacyIconName | NucleusIconName;

const iconUrl = (name: IconType) =>
  name in NUCLEUS_ICONS
    ? NUCLEUS_ICONS[name as NucleusIconName]
    : `/icons/${name}.svg`;

interface IconImageProps {
  className?: string;
  bgClassName?: string;
  /** Render the image with its own colors instead of as a tinted mask. */
  noMask?: boolean;
  /** Accessible name; omit for purely decorative icons. */
  label?: string;
}

/**
 * Renders an SVG as a CSS mask so it takes the current text color, the same
 * way World App tints its template images. `noMask` keeps the artwork's colors.
 */
function IconImage(props: IconImageProps & { src: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        props.bgClassName,
      )}
      role={props.label ? "img" : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : true}
    >
      <span
        className={cn(
          styles.icon,
          {
            "bg-current": !props.noMask,
            "no-mask": props.noMask,
          },
          props.className,
        )}
        style={{ "--image": `url(${props.src})` } as React.CSSProperties}
      />
    </span>
  );
}

/** Icon from the Nucleus set (or the few legacy glyphs), by name. */
export const Icon = React.memo(function Icon(
  props: IconImageProps & { name: IconType },
) {
  const { name, ...rest } = props;
  return (
    <IconImage
      src={iconUrl(name)}
      {...rest}
    />
  );
});

/** Artwork bundled from World App, by asset URL (see `@/lib/assets`). */
export const AssetIcon = React.memo(function AssetIcon(
  props: IconImageProps & { src: string },
) {
  return <IconImage {...props} />;
});
