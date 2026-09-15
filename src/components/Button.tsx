import { cn } from "@/lib/utils";
import React from "react";
import { ActivityIndicator } from "./ActivityIndicator";

/**
 * World App button styles (WLDUICore / Nucleus):
 * - primary:   inverse fill, inverse label
 * - secondary: page fill, 1px secondary stroke
 * - tertiary:  secondary fill, no stroke
 * - ghost:     8% white, for dark surfaces such as the scanner
 * - warning:   red600 fill, destructive
 */
export type ButtonVariant =
  | "ghost"
  | "primary"
  | "secondary"
  | "tertiary"
  | "warning";

/** Heights used across the app: 56 (normal), 48 / 40 (Nucleus), 44 (toolbar), 36 (nav bar). */
export type ButtonSize = 36 | 40 | 44 | 48 | 56;

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-surface-inverse text-fg-inverse active:bg-grey-900 disabled:bg-surface-disabled disabled:text-grey-300",
  secondary:
    "border border-stroke-secondary bg-surface-primary text-fg-primary active:bg-surface-secondary disabled:text-fg-disabled",
  tertiary:
    "bg-surface-secondary text-fg-primary active:bg-surface-tertiary disabled:text-fg-disabled",
  ghost:
    "bg-white/[0.08] text-white active:bg-white/[0.16] disabled:text-white/40",
  warning:
    "bg-status-error text-white active:bg-red-700 disabled:bg-surface-disabled disabled:text-grey-300",
};

const sizes: Record<ButtonSize, string> = {
  56: "h-14 px-6 text-l2",
  48: "h-12 px-6 text-l1",
  44: "h-11 px-4 text-l1",
  40: "h-10 px-5 text-l2",
  36: "h-9 px-4 text-s2",
};

const iconOnlySizes: Record<ButtonSize, string> = {
  56: "size-14",
  48: "size-12",
  44: "size-11",
  40: "size-10",
  36: "size-9",
};

const Button = React.memo(function Button(props: {
  children: React.ReactNode;
  type?: "button" | "reset" | "submit";
  onClick?: (
    event?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Square button that only holds an icon. */
  iconOnly?: boolean;
  fullWidth?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  isInvisible?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? 56;

  return (
    <button
      className={cn(
        "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full transition-press duration-100 ease-press",
        "active:scale-[0.97] disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-primary/20",
        variants[variant],
        props.iconOnly ? cn(iconOnlySizes[size], "px-0") : sizes[size],
        { "w-full": props.fullWidth },
        { "pointer-events-none invisible opacity-0": props.isInvisible },
        props.className,
      )}
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={!!props.isDisabled || !!props.isLoading}
      aria-label={props["aria-label"]}
      aria-busy={props.isLoading}
    >
      {props.isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <ActivityIndicator size={24} />
        </span>
      )}
      <span
        className={cn("inline-flex items-center justify-center gap-2", {
          invisible: props.isLoading,
        })}
      >
        {props.children}
      </span>
    </button>
  );
});

export default Button;
