import type {
  Bounds,
  QRScannerResultPoint,
  useQRScannerProps,
} from "@/types/qrcode";
import type { IScannerControls } from "@zxing/browser";
import { BrowserQRCodeReader } from "@zxing/browser";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export function useQRScanner(props: useQRScannerProps): {
  data: string | null;
  position: Bounds | null;
} {
  const [data, setData] = useState<string | null>(null);
  const [position, setPosition] = useState<Bounds | null>(null);

  useEffect(() => {
    let controls: IScannerControls | undefined;

    const codeReader = new BrowserQRCodeReader(undefined, {
      delayBetweenScanAttempts: 200,
      delayBetweenScanSuccess: 1000,
    });

    const handleData = (data: QRScannerResultPoint | undefined) => {
      if (!data) {
        return;
      }

      // NOTE: all large points
      const p = data.resultPoints.filter((i) => i.count !== undefined);

      // NOTE: point size
      const ps = p.reduce((r, c) => r + c.estimatedModuleSize, 0);

      // NOTE: calculate frame bounds
      const x0 = p.reduce((r, c) => Math.min(r, c.x), 999) - ps;
      const x1 = p.reduce((r, c) => Math.max(r, c.x), 0) + ps;
      const y0 = p.reduce((r, c) => Math.min(r, c.y), 999) - ps;
      const y1 = p.reduce((r, c) => Math.max(r, c.y), 0) + ps;

      if (props.videoRef.current) {
        // NOTE: video sizes
        const vw = props.videoRef.current.videoWidth;
        const vh = props.videoRef.current.videoHeight;

        // NOTE: calculate constraints
        const tc = props.scanConstraints?.top
          ? parseFloat(props.scanConstraints.top)
          : null;
        const rc = props.scanConstraints?.right
          ? parseFloat(props.scanConstraints.right)
          : null;
        const bc = props.scanConstraints?.bottom
          ? parseFloat(props.scanConstraints.bottom)
          : null;
        const lc = props.scanConstraints?.left
          ? parseFloat(props.scanConstraints.left)
          : null;

        if (tc && tc > (y0 / vh) * 100) {
          return;
        }

        if (rc && rc > 100 - (x1 / vw) * 100) {
          return;
        }

        if (bc && bc > 100 - (y1 / vh) * 100) {
          return;
        }

        if (lc && lc > (x0 / vw) * 1) {
          return;
        }
      }

      setData(data.text);
      setPosition([x0, x1, y0, y1]);
    };

    if (props.cameraReady && props.streamRef.current) {
      codeReader
        .decodeFromStream(
          props.streamRef.current,
          undefined,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          handleData,
        )
        .then((res) => (controls = res))
        .catch(() => {
          toast.error("Unexpected camera error, please, reload the page");
          console.warn("Unable run qr scanner");
        });
    }

    return () => {
      if (controls) {
        controls.stop();
      }
    };
  }, [
    props.cameraReady,
    props.scanConstraints,
    props.streamRef,
    props.videoRef,
  ]);

  return { ...{ data, position } };
}
