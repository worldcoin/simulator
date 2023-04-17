import type React from "react";
import type { PolymorphicPropsWithoutRef } from "react-polymorphic-types";
import cn from "classnames";

type ButtonProps<T extends React.ElementType = "button"> =
  PolymorphicPropsWithoutRef<
    {
      variant?: "primary" | "secondary";
      fullWidth?: boolean;
      isInvisible?: boolean; // TODO: this prop not used in the code, remove it
      isDisabled?: boolean; // TODO: this prop must be removed, use `disabled` instead
    },
    T
  >;

export default function Button<T extends React.ElementType = "button">(
  props: ButtonProps<T>,
) {
  const {
    as: Component = "button",
    children,
    className,
    variant,
    fullWidth,
    isInvisible,
    isDisabled,
    ...otherProps
  } = props;

  return (
    <Component
      className={cn(
        className,
        "font-sora font-semibold text-16 transition-all",
        {
          "text-gray-500": variant === undefined,
          "h-14 text-ffffff bg-gray-900 rounded-[10px]": variant === "primary",
          "h-14 text-gray-500 bg-gray-200 rounded-[10px]":
            variant === "secondary",
          "w-full": fullWidth,
          "pointer-events-none invisible opacity-0": isInvisible,
        },
      )}
      disabled={isDisabled}
      {...otherProps}
    >
      {children}
    </Component>
  );
}
