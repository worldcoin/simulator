import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";
import { parseWorldIDQRCode } from "@/lib/validation";
import { useModalStore } from "@/stores/modalStore";
import type { ScanConstraints } from "@/types/qrcode";
import jsQR from "jsqr";
import React, { Fragment, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { QRFrame } from "./QRFrame";

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  // NOTE: constraints in percents
  scanConstraints?: ScanConstraints;
  performVerification: (data: string) => Promise<void>;
  onClickManualInput?: () => void;
}

export const QRScanner = React.memo(function QRScanner(props: QRScannerProps) {
  const [data, setData] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  // const [position, setPosition] = useState<Bounds | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef(document.createElement("canvas"));
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { open } = useModalStore();

  // After data is set, check it's validity and perform verification
  useEffect(() => {
    if (!data) {
      return;
    }

    const t = setTimeout(() => setValid(null), 2000);

    try {
      const res = parseWorldIDQRCode(data);
      if (res.valid) {
        clearTimeout(t);
        setValid(true);
        void props.performVerification(data);
      } else {
        throw res.errorMessage;
      }
    } catch (err) {
      setValid(false);
      toast.error(typeof err === "string" ? err : "Unsupported QR code");
    }
  }, [data, props]);

  // On initial load, start scanning the video stream
  useEffect(() => {
    function scan() {
      if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          setData(code.data);
          setTimeout(() => null, 1000); // Wait 1 second before scanning again
        }
      }
      setTimeout(() => requestAnimationFrame(scan), 200); // Only scan 5 times a second
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          // video.setAttribute("playsinline", "true");
          void video.play();
          requestAnimationFrame(scan);
        }
      })
      .catch((error) => {
        console.error(error);
        setAllowed(false);
      });
  }, []);

  // Close scanner once modal opens
  useEffect(() => {
    if (open) {
      props.onClose();
    }
  }, [open, props]);

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      closeIcon="close"
    >
      <h2 className="relative z-10 py-1.5 text-center text-h3 font-bold text-white">
        Scanner
      </h2>

      <div
        ref={containerRef}
        className={cn("absolute inset-0 bg-black", props.className)}
      >
        {allowed !== false && (
          <Fragment>
            <video
              muted
              playsInline
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />

            <QRFrame
              valid={valid}
              videoRef={videoRef}
              containerRef={containerRef}
            />

            <div className="absolute bottom-40 left-1/2 flex -translate-x-1/2 flex-col items-center gap-25 pb-8">
              <div className="space-y-4 text-center font-rubik text-white">
                <p className="text-20 font-semibold">Scan QR code</p>

                <p>Use this QR code for payments and identity verification</p>
              </div>
            </div>
          </Fragment>
        )}

        {allowed === false && (
          <div className="absolute inset-x-0 top-1/2 grid -translate-y-1/2 items-center justify-items-center space-y-8">
            <span className="rounded-full bg-gray-100 p-7">
              <Icon
                name="camera-off"
                className="h-8 w-8 text-gray-400"
              />
            </span>

            <div className="space-y-4 px-14 text-center font-rubik text-white">
              <p className="text-20 font-semibold">
                Allow Worldcoin to access your camera
              </p>

              <p>This lets you scan QR codes.</p>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-12 flex justify-center">
          <button
            className="flex flex-col items-center"
            onClick={props.onClickManualInput}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
              <Icon
                name="text"
                className="h-6 w-6"
              />
            </div>

            <div className="mt-3 text-b3 text-white">Manual Input</div>
          </button>
        </div>
      </div>
    </Dialog>
  );
});
