import Button from "@/common/Button/Button";
import { parseWorldIDQRCode } from "@/common/helpers";
import { Icon } from "@/common/Icon";
import Status from "@/common/Status";
import gradientSpinnerSvg from "@static/gradient-spinner.svg";
import noCamera from "@static/no-camera.svg";
import noQr from "@static/no-qr.svg";
import Scanner from "qr-scanner";
import React from "react";

const QrScanner = React.memo(function QrScanner(props: {
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  applyURL: (data: string) => Promise<void>;
}) {
  const { applyURL } = props;

  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const [checking, setChecking] = React.useState<boolean>(false);
  const [checkingError, setCheckingError] = React.useState<unknown>(null);
  const [checked, setChecked] = React.useState<boolean>(false);

  const [starting, setStarting] = React.useState<boolean>(false);
  const [startingError, setStartingError] = React.useState<unknown>(null);
  const [started, setStarted] = React.useState<boolean>(false);

  const [invalid, setInvalid] = React.useState<boolean>(false);
  const [applying, setApplying] = React.useState<boolean>(false);
  const applyingRef = React.useRef(false);

  const closeModal = React.useCallback(() => {
    props.setIsModalVisible(false);
  }, [props]);

  React.useEffect(() => {
    setChecking(true);
    Scanner.hasCamera()
      .then((hasCamera) => {
        if (!hasCamera) {
          setChecking(false);
          setCheckingError("No camera");
          return false;
        }
        return navigator.mediaDevices
          .getUserMedia({
            video: { facingMode: "environment" },
          })
          .then((stream) => {
            return stream.active;
          })
          .catch(() => {
            setChecking(false);
            setCheckingError("No camera");
            return false;
          });
      })
      .then((hasCamera) => {
        setChecking(false);
        setChecked(hasCamera);
      })
      .catch((error) => {
        setChecking(false);
        setCheckingError(error);
      });
  }, []);

  React.useEffect(() => {
    if (!checked || invalid || !videoRef.current) {
      return;
    }
    setStarting(true);
    const qrScanner = new Scanner(
      videoRef.current,
      (result) => {
        if (!applyingRef.current && result.data) {
          const { valid, errorMessage, uri } = parseWorldIDQRCode(result.data);
          if (!valid || !uri) {
            console.error(errorMessage);
            setInvalid(true);
            return;
          }
          setApplying(true);
          applyingRef.current = true;
          applyURL(uri)
            .then(() => {
              setApplying(false);
              applyingRef.current = false;
              closeModal();
            })
            .catch((error) => {
              console.error(error);
              setApplying(false);
              applyingRef.current = false;
              setInvalid(true);
            });
        }
      },
      {
        preferredCamera: "environment",
        highlightCodeOutline: true,
        maxScansPerSecond: 5,
        calculateScanRegion: (video) => ({
          x: 0,
          y: 0,
          width: video.videoWidth,
          height: video.videoHeight,
          downScaledHeight: 0,
          downScaledWidth: 0,
        }),
      },
    );
    qrScanner
      .start()
      .then(() => {
        setStarting(false);
        setStarted(true);
      })
      .catch((error) => {
        setStarting(false);
        setStartingError(error);
      });
    return () => {
      qrScanner.stop();
      qrScanner.destroy();
    };
  }, [checked, invalid, applyURL, closeModal]);

  const tryAgain = React.useCallback(() => {
    setInvalid(false);
  }, []);

  return (
    <div className="grid grid-rows-1fr/auto">
      {checking && (
        <div className="grid items-center justify-center">
          <Icon
            className="h-8 w-8 animate-spin"
            data={gradientSpinnerSvg}
            noMask
          />
        </div>
      )}
      {(!!checkingError || !!startingError) && (
        <div className="flex flex-col items-center justify-start gap-y-4 text-center">
          <Status className="mt-15">
            <Icon
              data={noCamera}
              className="h-[38px] w-[38px]"
              noMask
            />
          </Status>
          <div className="mt-4 font-sora text-26 font-semibold">
            No camera found
          </div>
          <div className="text-18 leading-tight">
            If you want to use a camera to scan a QR code, make sure that the
            application has the required privacy settings or try again later.
          </div>
        </div>
      )}
      {started && invalid && (
        <div className="flex flex-col items-center justify-start gap-y-4 text-center">
          <Status className="mt-15">
            <Icon
              data={noQr}
              className="h-[33px] w-[33px]"
              noMask
            />
          </Status>
          <div className="mt-4 font-sora text-26 font-semibold">
            QR not supported
          </div>
          <div className="grow text-18 leading-tight">
            It seems you are trying to scan different type of QR code that we
            are supporting.
          </div>
          <Button
            onClick={tryAgain}
            className="mt-8 w-full rounded-full bg-4940e0 py-4.5 text-center font-semibold text-ffffff hover:opacity-70"
          >
            Try again
          </Button>
        </div>
      )}
      {checked && !invalid && (
        <div>
          <div className="relative self-start overflow-hidden rounded-24 bg-000000 pb-full">
            <div className="absolute inset-0 grid items-center justify-center">
              <video
                ref={videoRef}
                className="col-start-1 row-start-1 !h-full !w-full object-cover object-center"
              />
              {starting && (
                <div className="absolute grid h-full w-full items-center justify-center">
                  <Icon
                    className="h-8 w-8 animate-spin"
                    data={gradientSpinnerSvg}
                    noMask
                  />
                </div>
              )}
            </div>
          </div>
          <h2 className="mt-8 text-center font-sora text-26 font-semibold">
            {applying ? "Done" : "Scan World ID QR"}
          </h2>
          {applying && (
            <div className="mt-6 grid justify-center">
              <Icon
                className="h-8 w-8 animate-spin"
                data={gradientSpinnerSvg}
                noMask
              />
            </div>
          )}
        </div>
      )}
      <Button
        onClick={closeModal}
        className="mt-1.5 self-end font-medium text-858494 hover:opacity-70"
      >
        Dismiss
      </Button>
    </div>
  );
});

export default QrScanner;
