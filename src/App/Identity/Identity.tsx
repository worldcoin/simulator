import Modal from "@/App/Identity/Modal/Modal";
import QrInput from "@/App/Identity/QrInput/QrInput";
import QrScanner from "@/App/Identity/QrScanner/QrScanner";
import { GradientButton } from "@/common/GradientButton/GradientButton";
import { Icon } from "@/common/Icon";
import { connectWallet } from "@/lib/init-walletconnect";
import type { WalletConnectFlow } from "@/types";
import { IdentityState, TabsType } from "@/types";
import { Phase } from "@/types/common";
import type { Identity as IdentityType } from "@/types/identity";
import checkmarkSvg from "@static/checkmark-alt.svg";
import copySvg from "@static/copy.svg";
import logoutIconSvg from "@static/logout.svg";
import qrSvg from "@static/qr.svg";
import { getSdkError } from "@walletconnect/utils";
import blockies from "blockies-ts";
import cn from "classnames";
import React from "react";
import { toast } from "react-toastify";
import { Background } from "./Background/Background";
import { Card } from "./Card";
import { IdentityVerification } from "./IdentityVerification/IdentityVerification";
import { Tabs } from "./Tabs/Tabs";
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
  phase: Phase;
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  className?: string;
  identity: IdentityType;
  verificationSkipped: boolean;
  setIdentity: React.Dispatch<React.SetStateAction<IdentityType>>;
  setVerificationSkipped: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [inputMode, setInputMode] = React.useState<InputMode>(InputMode.Manual);
  const handleChangeTab = React.useCallback((tab: TabsType) => {
    if (tab !== TabsType.Wallet) {
      toast("This tab is not available in the simulator", { type: "info" });
    }
  }, []);

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

  const [
    isIdentityVerificationModalVisible,
    setIsIdentityVerificationModalVisible,
  ] = React.useState<boolean>(false);

  const [approval, setToApprove] = React.useState<WalletConnectFlow>({
    client: {},
    proposal: {},
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

  const applyURL = React.useCallback(
    async (uri: string) => {
      if (!uri) {
        return;
      }
      console.log("uri", uri);
      const request = await connectWallet({ uri, identity: props.identity });
      setToApprove({ ...approval, ...request });
      setIsVerificationModalVisible(true);
      setIsScanModalVisible(false);
    },
    [approval, props.identity],
  );

  const openVerification = React.useCallback(() => {
    props.setPhase(Phase.VerifyIdentity);
  }, [props]);

  const startScan = React.useCallback(() => {
    setInputMode(InputMode.Scan);
    if (!props.verificationSkipped) {
      sessionStorage.setItem("IdentityState", JSON.stringify(IdentityState.QR));
      return openVerification();
    }

    setIsScanModalVisible(true);
  }, [openVerification, props.verificationSkipped]);

  const startInputQR = React.useCallback(() => {
    setInputMode(InputMode.Manual);
    if (!props.verificationSkipped) {
      sessionStorage.setItem("IdentityState", JSON.stringify(IdentityState.QR));
      return openVerification();
    }

    setIsScanModalVisible(true);
  }, [openVerification, props.verificationSkipped]);

  const dismiss = React.useCallback(() => {
    console.log("session:", approval.proposal);
    if (approval.client && approval.proposal?.params.pairingTopic) {
      void approval.client
        .disconnect({
          topic: approval.proposal.params.pairingTopic,
          reason: getSdkError("USER_DISCONNECTED"),
        })
        .catch(console.error.bind(console));
    }
    setIsVerificationModalVisible((prevState) => !prevState);
  }, [approval.client, approval.proposal]);

  const copyIdentity = React.useCallback(() => {
    navigator.clipboard
      .writeText(encodeIdentityCommitment(props.identity.commitment))
      .then(() => console.log(`id copied to clipboard`))
      .catch((error) => console.error(error));
  }, [props.identity.commitment]);

  const handleVerify = React.useCallback(
    () => setIsIdentityVerificationModalVisible(true),
    [],
  );

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
          className="absolute inset-0 z-[1] -mx-8 overflow-hidden dark:mix-blend-soft-light"
        />

        <div className="grid grid-flow-col justify-between">
          <button
            onClick={startInputQR}
            className={cn(
              "flex items-center gap-x-2 rounded-full bg-f1f5f8 p-2 pr-3 text-000000 dark:bg-191c20 dark:text-ffffff",
              {
                invisible:
                  !props.identity.verified && !props.verificationSkipped,
              },
            )}
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
        <div className="z-10 grid w-[250px] content-end justify-items-center gap-y-5 justify-self-center">
          <Card
            verified={props.identity.verified}
            skippedVerification={props.verificationSkipped}
            onVerify={handleVerify}
          />

          <GradientButton
            onClick={handleVerify}
            isVisible={!props.identity.verified && !props.verificationSkipped}
            className="h-[54px] w-full text-14"
            gradientText
            withShadow
          >
            Verify your identity
          </GradientButton>

          <GradientButton
            onClick={startScan}
            isVisible={props.identity.verified || props.verificationSkipped}
            className="h-[54px] w-full text-14"
            gradientText
            textClassName="flex gap-x-2 justify-center normal-case"
          >
            <Icon
              data={qrSvg}
              className="h-4.5 w-4.5 text-[#ff6848]"
            />
            Scan to use World ID
          </GradientButton>
        </div>

        <div className="mx-2 grid justify-items-center gap-y-2 self-center">
          <div className="grid w-full grid-cols-1fr/auto rounded-8 border border-d1d3d4 dark:border-d1d3d4/40">
            <div className="grid grid-cols-auto/1fr/auto items-center gap-x-2 justify-self-start py-4.5 pl-6">
              <img
                src={blockiesSrc}
                alt="Blockies Avatar"
                className="h-5 w-5 rounded-full"
              />

              <p className="text-16 font-medium leading-none text-000000 dark:text-ffffff">
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
              className="group border-l border-d1d3d4 p-4.5 dark:border-d1d3d4/40"
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
        currentTab={TabsType.Wallet}
        setTab={handleChangeTab}
      />

      <Modal
        isVisible={isIdentityVerificationModalVisible}
        setIsVisible={setIsIdentityVerificationModalVisible}
        className="!h-auto px-6 !pb-3.5"
      >
        <IdentityVerification
          identity={props.identity}
          onClose={() => setIsIdentityVerificationModalVisible(false)}
          setIdentity={props.setIdentity}
          setVerificationSkipped={props.setVerificationSkipped}
        />
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
            applyURL={applyURL}
          />
        )}
      </Modal>

      <Modal
        isVisible={isVerificationModalVisible}
        setIsVisible={setIsVerificationModalVisible}
      >
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
