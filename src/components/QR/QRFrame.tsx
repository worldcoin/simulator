import { cn } from "@/lib/utils";
import type { Bounds } from "@/types";
import type { MutableRefObject } from "react";
import { useEffect, useState } from "react";

interface QRFrameProps {
  valid?: boolean | null;
  // position: Bounds | null; // TODO: Add back QR code position calculation
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  containerRef: MutableRefObject<HTMLElement | null>;
  classNames?: string;
}

// NOTE: minify path d attribute value
const minD = (d: string) =>
  d
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/(\s|)([a-z])(\s|)/gi, "$2")
    .replace(/(\s|)(-)(\s|)/gi, "$2");

export function QRFrame(props: QRFrameProps) {
  const [frame, setFrame] = useState("");
  const [border, setBorder] = useState("");

  // NOTE: calculate svg paths
  useEffect(() => {
    const container = props.containerRef.current;
    const video = props.videoRef.current;

    if (!container || !video) {
      return;
    }

    // NOTE: calculate frame position
    const calcShapes = () => {
      // NOTE: init frame width
      const d = 188;

      // NOTE: container sizes
      const cw = container.offsetWidth;
      const ch = container.offsetHeight;

      // NOTE: video sizes
      // const vw = video.videoWidth;
      // const vh = video.videoHeight;

      // NOTE: real video sizes
      // const rw = vw === vh ? Math.max(cw, ch) : vw > vh ? vw + ch - vh : cw;
      // const rh = vw === vh ? Math.max(cw, ch) : vw > vh ? ch : vh + cw - vw;

      // NOTE: scale multiplier
      // const wm = rw / vw;
      // const hm = rh / vh;

      // NOTE: frame bounds
      const f: Bounds = [cw / 2 - d / 2, cw / 2 + d / 2, ch / 6, ch / 6 + d];

      // if (props.position) {
      //   f = [
      //     props.position[0] * wm - (rw - cw) / 2,
      //     props.position[1] * wm - (rw - cw) / 2,
      //     props.position[2] * hm - (rh - ch) / 2,
      //     props.position[3] * hm - (rh - ch) / 2,
      //   ];
      // }

      // NOTE: padding
      const p = ((f[1] - f[0]) / 100) * 2;

      const frame = `
        M ${cw} 0
        H 0
            v ${ch}
            h ${cw}
        M ${f[0]} ${f[2] - 26 - p}
            c -14 0 -26 12 -26 26
            v ${f[3] - f[2] + p}
            c 0 14 12 26 26 26
            h ${f[1] - f[0] + p}
            c 14 0 26 -12 26 -26
            v -${f[3] - f[2] + p}
            c 0 -14 -12 -26 -26 -26
            h -${f[1] - f[0] + p}
      `;

      const border = `
        M ${f[0] + 26 - 5} ${f[2] - 26 - p}
            h -21
            c -14 0 -26 11 -26 26
            v 20
        M ${f[1] + 26 + p} ${f[2] + 26 - 5 - p}
            v -21
            c 0 -14 -12 -26 -26 -26
            h -20
        M ${f[1] - 26 + 5 + p} ${f[3] + 26}
            h 21
            c 14 0 26 -12 26 -26
            v -20
        M ${f[0] - 26} ${f[3] + 5 - 26}
            v 21
            c 0 14 12 26 26 26
            h 20
      `;

      setFrame(minD(frame));
      setBorder(minD(border));
    };

    calcShapes();

    window.addEventListener("resize", calcShapes);

    return () => {
      window.removeEventListener("resize", calcShapes);
    };
  }, [props.containerRef, props.videoRef]);

  return (
    <svg
      className={cn("absolute inset-0", props.classNames)}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      fill="none"
    >
      <path
        d={frame}
        fill="#191C20"
        fillRule="evenodd"
        clipRule="evenodd"
        opacity=".7"
        className="transition-all"
      />
      <path
        d={border}
        strokeLinecap="round"
        strokeWidth="4"
        className={cn("transition-all", {
          "stroke-[#FF5A76]": props.valid === false,
          "stroke-[#fff]": props.valid !== false,
        })}
      />
    </svg>
  );
}
