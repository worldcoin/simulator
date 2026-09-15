import { cn } from "@/lib/utils";
import type { MutableRefObject } from "react";
import { useEffect, useState } from "react";

/** World App's scanner viewfinder: a 240pt window with 24pt corners and round-capped brackets. */
const FRAME_SIZE = 240;
const RADIUS = 24;
const BRACKET = 32;

interface QRFrameProps {
  valid?: boolean | null;
  containerRef: MutableRefObject<HTMLElement | null>;
  className?: string;
}

export function QRFrame(props: QRFrameProps) {
  const [paths, setPaths] = useState<{ scrim: string; brackets: string }>();

  useEffect(() => {
    const container = props.containerRef.current;
    if (!container) return;

    const calcShapes = () => {
      const cw = container.offsetWidth;
      const ch = container.offsetHeight;
      const d = FRAME_SIZE;
      const r = RADIUS;
      const l = BRACKET;

      const x0 = (cw - d) / 2;
      const y0 = Math.max(24, (ch - d) / 2 - 80);
      const x1 = x0 + d;
      const y1 = y0 + d;

      // Full-bleed rectangle with a rounded window cut out (even-odd fill).
      const scrim = [
        `M0 0H${cw}V${ch}H0Z`,
        `M${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}`,
        `A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${
          y1 - r
        }`,
        `V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`,
      ].join("");

      const brackets = [
        `M${x0} ${y0 + r + l}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}H${
          x0 + r + l
        }`,
        `M${x1 - r - l} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${
          y0 + r + l
        }`,
        `M${x1} ${y1 - r - l}V${y1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${
          x1 - r - l
        }`,
        `M${x0 + r + l} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}V${
          y1 - r - l
        }`,
      ].join("");

      setPaths({ scrim, brackets });
    };

    calcShapes();
    window.addEventListener("resize", calcShapes);

    return () => {
      window.removeEventListener("resize", calcShapes);
    };
  }, [props.containerRef]);

  return (
    <svg
      className={cn("absolute inset-0", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden
    >
      <path
        d={paths?.scrim}
        fill="#000000"
        fillRule="evenodd"
        clipRule="evenodd"
        opacity=".7"
      />
      <path
        d={paths?.brackets}
        strokeLinecap="round"
        strokeWidth="4"
        className={cn("transition-colors", {
          "stroke-red-600": props.valid === false,
          "stroke-white": props.valid !== false,
        })}
      />
    </svg>
  );
}
