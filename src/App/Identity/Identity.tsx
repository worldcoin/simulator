import Modal from "@/App/Identity/Modal/Modal";
import QrScanner from "@/App/Identity/QrScanner/QrScanner";
import { GradientButton } from "@/common/GradientButton/GradientButton";
import { parseWorldIDQRCode } from "@/common/helpers";
import { Icon } from "@/common/Icon";
import Tooltip from "@/common/Tooltip/Toolip";
import { connectWallet } from "@/lib/init-walletconnect";
import type { WalletConnectFlow } from "@/types";
import { IdentityState, TabsType } from "@/types";
import { Phase } from "@/types/common";
import type { Identity as IdentityType } from "@/types/identity";
import checkmarkSvg from "@static/checkmark-alt.svg";
import copySvg from "@static/copy.svg";
import humanSvg from "@static/human.svg";
import logoutIconSvg from "@static/logout.svg";
import qrSvg from "@static/qr.svg";
import questionSvg from "@static/question.svg";
import blockies from "blockies-ts";
import cn from "classnames";
import React from "react";
import { usePopperTooltip } from "react-popper-tooltip";
import { Background } from "./Background/Background";
import { IdentityVerification } from "./IdentityVerification/IdentityVerification";
import { Tabs } from "./Tabs/Tabs";
import QrInput from "@/App/Identity/QrInput/QrInput";
// import Verification from "./Verification/Verification";

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
  phase: Phase;
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  className?: string;
  identity: IdentityType;
  setExtendedVerifyIdentity: React.Dispatch<React.SetStateAction<boolean>>;
  verificationSkipped: boolean;
}) {
  const [input, setInput] = React.useState<string>("");
  const [inputMode, setInputMode] = React.useState<InputMode>(InputMode.Manual);
  const [pasteError, setPasteError] = React.useState<string>("");
  const [applyInProgress, setApplyInProgress] = React.useState(false);
  const [tab, setTab] = React.useState<TabsType>(TabsType.Wallet);

  const logout = React.useCallback(() => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {}
    location.reload();
  }, []);

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
      setApplyInProgress(true);
      const request = await connectWallet({ uri, identity: props.identity });
      setToApprove({ ...approval, ...request });
      setApplyInProgress(false);
      setIsVerificationModalVisible(true);
    },
    [approval, props.identity],
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
      const { valid, errorMessage, uri } = parseWorldIDQRCode(data);

      if (!valid || !uri) {
        setPasteError("Please provide a valid WalletConnect session URI");
        setTimeout(() => setInput(""), 500);
        return console.error(errorMessage);
      }

      setPasteError("");

      try {
        await applyURL(uri);
      } catch (error) {
        setApplyInProgress(false);
        setPasteError("Error with request. Check console.");
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
    <div className="grid grid-rows-1fr/auto">
      <div
        className={cn(
          "relative grid h-full content-start gap-y-8 pt-11 pb-6 xs:pt-0 xs:pb-0",
          props.className,
        )}
      >
        <Background
          phase={props.phase}
          className="absolute inset-0 z-[1] -mx-8 overflow-hidden"
        />

        <div className="-mx-4 grid grid-flow-col justify-between">
          <button
            onClick={() => setIsScanModalVisible(true)}
            className="flex items-center gap-x-2 rounded-full bg-f1f5f8 p-2 pr-3 text-000000"
          >
            <Icon
              data={qrSvg}
              className="h-6 w-6"
            />

            <span className="text-14 font-medium leading-1px">
              Enter or paste QR
            </span>
          </button>

          <button
            onClick={logout}
            className="ml-auto flex items-center gap-x-3 text-ff5a76"
          >
            <span className="font-medium">Sign Out</span>

            <Icon
              data={logoutIconSvg}
              className="h-6 w-6"
            />
          </button>
        </div>

        <div className="z-10 grid w-[250px] content-start justify-items-center gap-y-5 justify-self-center">
          <div className="grid h-[350px] content-start gap-y-3 rounded-18 border border-d1d3d4 bg-f1f5f8 px-3 pt-3">
            {visible && (
              <Tooltip
                ref={setTooltipRef}
                getTooltipProps={getTooltipProps({
                  className: "relative px-4 z-50",
                })}
                getArrowProps={getArrowProps({
                  className: "absolute bg-transparent hidden w-4 h-4 -top-1.5",
                })}
                backgroundColor="bg-191c20"
                className=" text-ffffff"
                text="This is just a representation of your current identity. It can let you know whether you’re using the same identity in multiple sessions. If you generate your identity with the same wallet, the same identity will be fetched."
              />
            )}

            <div ref={setTriggerRef}>
              <Icon
                data={questionSvg}
                className="h-4.5 w-4.5 text-858494"
              />
            </div>
            <Icon
              data={humanSvg}
              noMask
              className="h-[118px] w-[118px] justify-self-center"
            />

            <h1 className="mt-4 px-4 text-center font-sora font-semibold">
              Verify your identity to test World ID
            </h1>

            <p className="mt-0.5 text-center text-14 text-858494">
              Orbs verify your biometrics in a privacy preserving way to make
              sure everyone in the World gets only one World ID.
            </p>
          </div>

          <GradientButton
            onClick={() => setIsVerificationModalVisible(true)}
            isVisible={!props.identity.verified}
            className="h-[54px] w-full text-14"
            gradientText
          >
            Verify your identity
          </GradientButton>
        </div>

        <div className="grid justify-items-center gap-y-2 self-center">
          <div className="grid w-full grid-cols-1fr/auto rounded-8 border border-d1d3d4">
            <div className="grid grid-cols-auto/1fr/auto items-center gap-x-2 justify-self-start py-4.5 pl-6">
              <img
                src={blockiesSrc}
                alt="Blockies Avatar"
                className="h-5 w-5 rounded-full"
              />

              <p className="text-16 font-medium leading-none text-000000">
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
              className="group border-l border-d1d3d4 p-4.5"
            >
              <Icon
                data={copySvg}
                className="h-5 w-5 text-4940e0 transition-colors group-hover:text-4940e0/60"
              />
            </button>
          </div>

          <p className="text-center text-14 text-777e90">
            This is a representation of your identity for debugging purposes.
          </p>
        </div>
      </div>

      <Tabs
        currentTab={tab}
        setTab={setTab}
      />

      <Modal
        isVisible={isVerificationModalVisible}
        setIsVisible={setIsVerificationModalVisible}
        className="px-6 !pb-3.5"
      >
        <IdentityVerification />
      </Modal>

      <Modal
        isVisible={isScanModalVisible}
        setIsVisible={setIsScanModalVisible}
        className={cn("!gap-y-4 px-4 !pb-3.5", {
          "!h-auto": isScanModalVisible && inputMode === InputMode.Manual,
        })}
      >
        {isScanModalVisible && inputMode === InputMode.Scan && (
          <QrScanner
            setIsModalVisible={setIsScanModalVisible}
            applyURL={applyURL}
          />
        )}
        {isScanModalVisible && inputMode === InputMode.Manual && (
          <QrInput
            setIsModalVisible={setIsScanModalVisible}
            onSelectScan={toggleInputMode}
            onPaste={onPaste}
            onInput={onInput}
          />
        )}
      </Modal>

      {/* <Modal isVisible={isVerificationModalVisible}>
        {isVerificationModalVisible && (
          <Verification
            approval={approval}
            identity={props.identity}
            dismiss={dismiss}
          />
        )}
      </Modal> */}
    </div>
  );
});

export default Identity;
