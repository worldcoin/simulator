import type { IconType } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * World App settings row: 24pt leading icon, `s1` title with optional `b3`
 * detail, and a trailing chevron unless something else is supplied.
 */
export function Row(props: {
  title: string;
  icon?: IconType;
  leading?: ReactNode;
  detail?: string;
  trailing?: ReactNode;
  /** Controls rendered beside the row, outside its button (e.g. a remove action). */
  actions?: ReactNode;
  destructive?: boolean;
  divider?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn("group flex items-center gap-2", {
        "border-b border-stroke-tertiary": props.divider,
      })}
    >
      <button
        type="button"
        onClick={props.onClick}
        disabled={!!props.disabled || !props.onClick}
        className="flex min-w-0 flex-1 items-center gap-3 py-4 text-left outline-none transition-press duration-100 ease-press active:opacity-70"
      >
        {props.leading}
        {props.icon && (
          <Icon
            name={props.icon}
            className={cn("size-6", {
              "text-fg-secondary": !props.destructive,
              "text-status-error": props.destructive,
            })}
          />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn("truncate text-s1", {
              "text-fg-primary": !props.destructive,
              "text-status-error": props.destructive,
            })}
          >
            {props.title}
          </span>
          {props.detail && (
            <span className="truncate text-b3 text-fg-tertiary">
              {props.detail}
            </span>
          )}
        </span>
        {props.trailing ??
          (props.onClick && (
            <Icon
              name="chevron-right"
              className="size-6 text-fg-tertiary"
            />
          ))}
      </button>
      {props.actions}
    </div>
  );
}
