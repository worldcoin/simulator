import Modal from "@/App/Identity/Modal/Modal";
import QrScanner from "@/App/Identity/QrScanner/QrScanner";
import Button from "@/common/Button/Button";
import { validateWalletUri } from "@/common/helpers";
import { Icon } from "@/common/Icon";
import Tooltip from "@/common/Tooltip/Toolip";
import { connectWallet } from "@/lib/init-walletconnect";
import type { WalletConnectFlow } from "@/types";
import { IdentityState } from "@/types";
import { Phase } from "@/types/common";
import type { Identity as IdentityType } from "@/types/identity";
import checkmarkSvg from "@static/checkmark-alt.svg";
import copySvg from "@static/copy.svg";
import infoSvg from "@static/info.svg";
import passportSvg from "@static/passport.svg";
import spinnerSvg from "@static/spinner.svg";
import blockies from "blockies-ts";
import cn from "classnames";
import React from "react";
import { usePopperTooltip } from "react-popper-tooltip";
import Verification from "./Verification/Verification";

enum InputMode {
  Manual,
  Scan,
}

export const encodeIdentityCommitment = (
  identityCommitment: BigInt,
): string => {
  return identityCommitment.toString(16).padStart(64, "0");
};

const Identity = React.memo(function Identity(props: {
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  className?: string;
  identity: IdentityType;
  setExtendedVerifyIdentity: React.Dispatch<React.SetStateAction<boolean>>;
  verificationSkipped: boolean;
}) {
  const [input, setInput] = React.useState<string>("");
  const [inputMode, setInputMode] = React.useState<InputMode>(InputMode.Scan);
  const [pasteError, setPasteError] = React.useState<string>("");
  const [applyInProgress, setApplyInProgress] = React.useState(false);

  const blockiesSrc = React.useMemo(() => {
    if (!props.identity.id) {
      return "";
    }

    return blockies
      .create({ seed: props.identity.id, size: 10, scale: 2 })
      .toDataURL();
  }, [props.identity.id]);

  const [isScanModalVisible, setIsScanModalVisible] =
    React.useState<boolean>(false);

  const [isVerificationModalVisible, setIsVerificationModalVisible] =
    React.useState<boolean>(false);

  const [approval, setToApprove] = React.useState<WalletConnectFlow>({
    connector: {},
    request: {},
    meta: {},
  } as WalletConnectFlow);

  React.useEffect(() => {
    try {
      const idState = JSON.parse(
        sessionStorage.getItem("IdentityState") ?? "",
      ) as IdentityState | null;

      if (idState === IdentityState.QR) {
        setIsScanModalVisible(true);
        return sessionStorage.removeItem("IdentityState");
      }

      if (idState === IdentityState.paste) {
        setInputMode(InputMode.Manual);
        return sessionStorage.removeItem("IdentityState");
      }

      return;
    } catch (error) {
      return;
    }
  }, []);

  const verifyIdentity = React.useCallback(() => {
    return props.setPhase(Phase.VerifyIdentity);
  }, [props]);

  const applyURL = React.useCallback(
    async (uri: string) => {
      if (!uri) {
        return;
      }
      console.log("uri", uri);

      setIsScanModalVisible(false);
      setApplyInProgress(true);
      const request = await connectWallet({ uri });
      setToApprove({ ...approval, ...request });
      setApplyInProgress(false);
      setIsVerificationModalVisible(true);
    },
    [approval],
  );

  const openVerification = React.useCallback(() => {
    props.setExtendedVerifyIdentity(true);
    props.setPhase(Phase.VerifyIdentity);
  }, [props]);

  const startScan = React.useCallback(() => {
    if (!props.verificationSkipped) {
      sessionStorage.setItem("IdentityState", JSON.stringify(IdentityState.QR));
      return openVerification();
    }

    setIsScanModalVisible(true);
  }, [openVerification, props.verificationSkipped]);

  const toggleInputMode = React.useCallback(() => {
    if (!props.verificationSkipped) {
      sessionStorage.setItem(
        "IdentityState",
        JSON.stringify(IdentityState.paste),
      );
      return openVerification();
    }

    if (inputMode === InputMode.Scan) {
      return setInputMode(InputMode.Manual);
    }

    return setInputMode(InputMode.Scan);
  }, [inputMode, openVerification, props]);

  const onPaste = React.useCallback(
    async (event: React.ClipboardEvent) => {
      const data = event.clipboardData.getData("Text");
      const validationResult = validateWalletUri(data);

      if (!validationResult.valid) {
        setPasteError("Please provide a valid WalletConnect session URI");
        setTimeout(() => setInput(""), 500);
        return console.error(validationResult.message);
      }

      setPasteError("");

      try {
        await applyURL(data);
      } catch (error) {
        setApplyInProgress(false);
        setPasteError("Connection can't be established");
        setTimeout(() => setInput(""), 500);
      }
    },
    [applyURL],
  );

  const onInput = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInput(event.target.value);
    },
    [],
  );

  const dismiss = React.useCallback(() => {
    setInputMode(InputMode.Scan);
    if (approval.connector?.connected)
      void approval.connector.killSession().catch(console.error.bind(console));
    setIsVerificationModalVisible((prevState) => !prevState);

    setInput("");
  }, [approval.connector]);

  const copyIdentity = React.useCallback(() => {
    navigator.clipboard
      .writeText(encodeIdentityCommitment(props.identity.commitment))
      .then(() => console.log(`id copied to clipboard`))
      .catch((error) => console.error(error));
  }, [props.identity.commitment]);

  const {
    getArrowProps,
    getTooltipProps,
    setTooltipRef,
    setTriggerRef,
    visible,
  } = usePopperTooltip({
    placement: "bottom",
    offset: [0, 8],
  });

  return (
    <div
      className={cn(
        "grid h-full content-between gap-y-16 pt-11 pb-6 xs:pt-0 xs:pb-0",
        props.className,
      )}
    >
      <div className="grid gap-y-12 text-ffffff">
        <div className="relative grid gap-x-1 justify-self-center pt-3 pr-5">
          <Icon
            data={passportSvg}
            className="h-[88px] w-16"
          />

          <div
            ref={setTriggerRef}
            className="absolute right-0 top-0 self-start"
          >
            <Icon
              data={infoSvg}
              className="h-5 w-5 rotate-180"
            />
          </div>
        </div>

        {visible && (
          <Tooltip
            ref={setTooltipRef}
            getTooltipProps={getTooltipProps({ className: "relative px-4" })}
            getArrowProps={getArrowProps({
              className: "absolute bg-transparent w-4 h-4 -top-1.5",
            })}
            backgroundColor="bg-ffffff"
            className="text-777e90"
            text="This is just a representation of your current identity. It can let you know whether you’re using the same identity in multiple sessions. If you generate your identity with the same wallet, the same identity will be fetched."
          />
        )}

        <div className="grid justify-items-center gap-y-4 self-center">
          <h2 className="text-24 font-semibold leading-none">
            Your Identity hash
          </h2>
          <div className="grid w-full grid-cols-1fr/auto rounded-8 border border-ffffff/30">
            <div className="grid grid-cols-auto/1fr/auto items-center gap-x-1.5 justify-self-center py-4.5">
              <img
                src={blockiesSrc}
                alt="Blockies Avatar"
                className="h-5 w-5 rounded-full"
              />

              <p className="text-18 leading-none text-ffffff/60">
                {props.identity.id}
              </p>

              {props.identity.verified && (
                <Icon
                  data={checkmarkSvg}
                  className="h-4.5 w-4.5"
                  noMask
                />
              )}
            </div>

            <button
              type="button"
              onClick={copyIdentity}
              className="group border-l border-ffffff/30 p-4.5"
            >
              <Icon
                data={copySvg}
                className="h-5 w-5 transition-colors group-hover:text-ffffff/60"
              />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        {inputMode === InputMode.Scan && (
          <div
            className={cn("grid gap-y-4 pb-6 transition-visibility/opacity", {
              "pointer-events-none invisible opacity-0": applyInProgress,
            })}
          >
            <Button
              onClick={verifyIdentity}
              isInvisible={props.identity.verified}
              className="border bg-ffffff text-4940e0 hover:opacity-80"
            >
              Verify your identity
            </Button>

            <Button
              onClick={startScan}
              className={cn(
                {
                  "border bg-ffffff text-4940e0 hover:opacity-80":
                    props.identity.verified,
                },
                {
                  "border border-ffffff/30 text-ffffff hover:opacity-80":
                    !props.identity.verified,
                },
              )}
            >
              Scan QR code
            </Button>

            <Button
              onClick={toggleInputMode}
              className="self-start border border-ffffff/30 text-ffffff hover:opacity-80"
            >
              Enter or paste code
            </Button>
          </div>
        )}

        {inputMode === InputMode.Manual && !applyInProgress && (
          <div className="grid gap-y-2">
            <input
              type="text"
              placeholder="Enter your code"
              className={cn(
                "min-w-0 rounded-full bg-transparent py-4.5 px-6 text-center text-ffffff outline-none transition-all",
                "shadow-[inset_0_0_0_1px_rgba(255,255,255,.3)] focus:shadow-[inset_0_0_0_2px_rgba(255,255,255,1)]",
              )}
              onPaste={onPaste}
              onInput={onInput}
              value={input}
            />

            <span
              className={cn("text-center text-12 text-ff6471", {
                "pointer-events-none invisible opacity-0": !pasteError,
              })}
            >
              {pasteError ? pasteError : "error"}
            </span>
          </div>
        )}

        {applyInProgress && (
          <div className="mb-28 grid content-center justify-center">
            <div className="rounded-full bg-ffffff p-4.5">
              <Icon
                data={spinnerSvg}
                className="h-5 w-5 animate-spin text-4940e0"
              />
            </div>
          </div>
        )}
      </div>

      <Modal isVisible={isScanModalVisible}>
        {isScanModalVisible && (
          <QrScanner
            setIsModalVisible={setIsScanModalVisible}
            applyURL={applyURL}
          />
        )}
      </Modal>

      <Modal isVisible={isVerificationModalVisible}>
        {isVerificationModalVisible && (
          <Verification
            approval={approval}
            identity={props.identity}
            dismiss={dismiss}
          />
        )}
      </Modal>
    </div>
  );
});

export default Identity;
