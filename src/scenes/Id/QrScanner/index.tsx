import React from "react";
import { parseWorldIDQRCode } from "@/lib/validate-wallet-uri";
import type { ScanConstraints } from "@/types/qr-scanner";
import clsx from "clsx";
import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Dialog } from "@/components/Dialog";
import { QrScannerFrame } from "./Frame";
import { useQrScanner } from "./useQrScanner";

export const QrScanner = React.memo(function QrScanner(props: {
  open: boolean;
  onClose: () => void;
  className?: string;
  // NOTE: constraints in percents
  scanConstraints?: ScanConstraints;
  onScanSuccess?: (data: string) => Promise<void>;
}) {
  const [cameraReady, setCameraReady] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream>();
  const canvasRef = useRef(document.createElement("canvas"));
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { data: qrData, position: qrPosition } = useQrScanner({
    cameraReady,
    streamRef,
    videoRef,
    scanConstraints: props.scanConstraints,
  });

  // NOTE: validate code
  useEffect(() => {
    if (!qrData) {
      return;
    }

    console.log(qrData);

    const t = setTimeout(() => setValid(null), 2000);

    try {
      const res = parseWorldIDQRCode(qrData);
      if (res.valid) {
        clearTimeout(t);
        setValid(true);
        void props.onScanSuccess?.(qrData);
      } else {
        throw res.errorMessage;
      }
    } catch (err) {
      setValid(false);
      toast.error(typeof err === "string" ? err : "Unsupported QR code");
    }
  }, [props, qrData]);

  // NOTE: init camera
  useEffect(() => {
    const stream = streamRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const isIOS = /(iPhone|iPad)/.test(navigator.userAgent);

    const onplay = () => setCameraReady(true);

    if (!stream && video) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: ["environment"],
            // NOTE: this prevents stuck camera on some IOS devices
            width: { ideal: isIOS ? 2048 : 4096 },
          },
          audio: false,
        })
        .then((stream) => {
          streamRef.current = stream;
          video.srcObject = stream;
          void video.play();
          video.addEventListener("canplay", onplay);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "NotAllowedError") {
            setAllowed(false);
          }
          setCameraReady(false);
        });
    }

    return () => {
      setCameraReady(false);
      canvas.remove();

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (video) {
        video.srcObject = null;
        video.removeEventListener("canplay", onplay);
      }
    };
  }, []);

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
    >
      <div
        className={clsx("absolute inset-0 bg-000000", props.className)}
        ref={containerRef}
      >
        {allowed !== false && (
          <Fragment>
            <video
              muted
              playsInline
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            <QrScannerFrame
              qrPosition={qrPosition}
              containerRef={containerRef}
              videoRef={videoRef}
              valid={valid}
            />

            <div className="absolute bottom-40 left-1/2 flex -translate-x-1/2 flex-col items-center gap-25 pb-8">
              <div className="space-y-4 text-center font-rubik text-ffffff">
                <p className="text-20 font-semibold">Scan QR code</p>
                <p>Use this QR code for payments and identity verification</p>
              </div>
            </div>
          </Fragment>
        )}

        {allowed === false && (
          <div className="absolute inset-x-0 top-1/2 grid -translate-y-1/2 items-center justify-items-center space-y-8">
            <span className="rounded-full bg-f3f4f5 p-7">
              {/*<Icon*/}
              {/*  data={cameraDisallow}*/}
              {/*  className="h-8 w-8 text-9ba3ae"*/}
              {/*/>*/}
            </span>

            <div className="space-y-4 px-14 text-center font-rubik text-ffffff">
              <p className="text-20 font-semibold">
                Allow Worldcoin to access your camera
              </p>

              <p>This lets you scan QR codes.</p>
            </div>
          </div>
        )}

        <div className="absolute inset-x-20 bottom-8 flex justify-items-stretch rounded-12 bg-3c424b p-0.5">
          <span className="flex-1 p-3 text-center text-ffffff">My QR</span>

          <span className="flex-1 rounded-12 bg-ffffff p-3 text-center text-191c20">
            Scan
          </span>
        </div>
      </div>
    </Dialog>
  );
});
