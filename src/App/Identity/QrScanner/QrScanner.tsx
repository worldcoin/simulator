import Button from "@/common/Button/Button";
import { parseWorldIDQRCode } from "@/common/helpers";
import { Icon } from "@/common/Icon";
import noCamera from "@static/no-camera.svg";
import spinnerSvg from "@static/spinner.svg";
import cn from "classnames";
import QrReader from "qr-scanner";
import React from "react";

const QrScanner = React.memo(function QrScanner(props: {
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  applyURL: (data: string) => Promise<void>;
}) {
  const videoElement = React.useRef<HTMLVideoElement | null>(null);
  const [hasRef, setHasRef] = React.useState<boolean>(false);
  const [hasCamera, setHasCamera] = React.useState<boolean>(false);
  const [isScannerReady, setIsScannerReady] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (hasCamera) {
      return;
    }

    QrReader.hasCamera()
      .then((result) => {
        if (!result) {
          return;
        }

        return navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      })
      .then((stream) => {
        if (!stream) {
          throw Error("The camera is not available");
        }

        setHasCamera(stream.active);
      })
      .catch((error) => console.error(error));
  }, [hasCamera]);

  const closeModal = React.useCallback(() => {
    props.setIsModalVisible(false);
  }, [props]);

  const onDecode = React.useCallback(
    async (result: QrReader.ScanResult) => {
      if (!result.data) {
        return;
      }

      const { valid, errorMessage, uri } = parseWorldIDQRCode(result.data);

      if (!valid || !uri) {
        console.error(errorMessage);
        return;
      }

      try {
        await props.applyURL(uri);
      } catch (error) {
        closeModal();
      }
    },
    [closeModal, props],
  );

  const calculateScanRegion = React.useCallback(
    (video: HTMLVideoElement): QrReader.ScanRegion => {
      const { videoHeight, videoWidth } = video;

      return {
        x: 0,
        y: 0,
        width: videoWidth,
        height: videoHeight,
        downScaledHeight: 0,
        downScaledWidth: 0,
      };
    },
    [],
  );

  const qrReader = React.useMemo(() => {
    if (!hasRef) {
      return;
    }

    if (!videoElement.current) {
      return;
    }

    return new QrReader(videoElement.current, onDecode, {
      preferredCamera: "environment",
      calculateScanRegion,
      highlightCodeOutline: true,
      maxScansPerSecond: 5,
    });
  }, [calculateScanRegion, hasRef, onDecode]);

  const turnOffScan = React.useCallback(() => {
    qrReader?.stop();
    qrReader?.destroy();
  }, [qrReader]);

  React.useEffect(() => {
    if (!qrReader) {
      return;
    }

    qrReader
      .start()
      .then(() => setIsScannerReady(true))
      .catch((error) => console.error(error));

    return () => turnOffScan();
  }, [qrReader, turnOffScan]);

  React.useEffect(() => {
    if (!videoElement.current || !hasCamera) {
      return setHasRef(false);
    }

    return setHasRef(true);
  }, [videoElement, hasCamera]);

  return (
    <div
      className={cn(
        "grid h-full max-h-full",
        { "content-between": hasCamera },
        { "content-end gap-y-8": !hasCamera },
      )}
    >
      {hasCamera && (
        <div className="relative self-start overflow-hidden rounded-24 bg-000000 pb-full">
          <div className="absolute inset-0 grid items-center justify-center">
            <Icon
              data={spinnerSvg}
              className={cn(
                "col-start-1 row-start-1 h-16 w-16 justify-self-center transition-visibility/opacity",
                { "pointer-events-none invisible opacity-0": isScannerReady },
                { "animate-spin": !isScannerReady },
              )}
              noMask
            />

            <video
              ref={videoElement}
              className="col-start-1 row-start-1 !h-full !w-full object-cover object-center"
            />
          </div>
        </div>
      )}

      {!hasCamera && (
        <div className="grid justify-items-center gap-y-3 text-center">
          <div className="grid h-32 w-32 items-center justify-center rounded-full bg-bbbec7/10">
            <Icon
              data={noCamera}
              className="h-16 w-16 text-183c4a"
            />
          </div>

          <div className="mt-15 text-16 font-semibold text-183c4a">
            No camera found
          </div>

          <div className="text-14 leading-tight text-777e90">
            If you want to use a camera to scan a QR code, make sure that the
            application has the required privacy settings or try again later.
          </div>
        </div>
      )}

      <Button
        onClick={closeModal}
        className="self-center text-777e90 hover:opacity-70"
      >
        Close
      </Button>
    </div>
  );
});

export default QrScanner;
