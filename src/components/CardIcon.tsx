import React from "react";
import type { IconType } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import clsx from "clsx";

export const CardIcon = React.memo(function CardIcon(props: {
  className?: string;
  color: string;
  name: IconType;
}) {
  return (
    <div
      className={clsx(
        props.className,
        "relative flex items-center justify-center",
      )}
      style={{
        "--color": props.color,
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 44 44"
        fill="none"
      >
        <rect
          width="44"
          height="44"
          rx="13.2"
          style={{ fill: "var(--color)" }}
        />

        <rect
          opacity="0.5"
          width="44"
          height="44"
          rx="13.2"
          fill="url(#paint0_radial_401_10740)"
        />

        <defs>
          <radialGradient
            id="paint0_radial_401_10740"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(1.60265 -8.73246) rotate(55.0103) scale(64.3663 64.0887)"
          >
            <stop stopColor="white" />

            <stop
              offset="1"
              stopColor="white"
              stopOpacity="0"
            />
          </radialGradient>
        </defs>
      </svg>

      <Icon
        name={props.name}
        className="h-6 w-6 text-ffffff"
      />
    </div>
  );
});
