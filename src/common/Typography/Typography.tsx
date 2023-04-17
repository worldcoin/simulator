import type React from "react";
import type { PolymorphicPropsWithoutRef } from "react-polymorphic-types";
import cn from "classnames";

type TypographyProps<T extends React.ElementType = "div"> =
  PolymorphicPropsWithoutRef<
    {
      variant: "h1" | "h2" | "s1";
    },
    T
  >;

export default function Typography<T extends React.ElementType = "div">(
  props: TypographyProps<T>,
) {
  const {
    as: Component = "div",
    children,
    className,
    variant,
    ...otherProps
  } = props;
  return (
    <Component
      className={cn(className, "", {
        "font-sora font-semibold text-30 leading-[1.2]": variant === "h1",
        "font-sora font-semibold text-26 leading-[1.2]": variant === "h2",
        "font-rubik font-medium text-18 leading-[1.2]": variant === "s1",
        "font-rubik text-14 leading-[1.3]": variant === "b3",
      })}
      {...otherProps}
    >
      {children}
    </Component>
  );
}
