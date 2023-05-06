import { useIdentityStorage } from "@/common/hooks";
import { Icon } from "@/common/Icon";
import { inclusionProof } from "@/lib/sequencer-service";
import type { Identity as IdentityType } from "@/types";
import { Phase } from "@/types";
import batterySvg from "@static/battery.svg";
import crossSvg from "@static/cross.svg";
import logoSvg from "@static/logo.svg";
import networkSvg from "@static/network.svg";
import spinnerSvg from "@static/spinner.svg";
import wifiSvg from "@static/wifi.svg";
import cn from "classnames";
import React from "react";
import { ToastContainer } from "react-toastify";
import { useMediaQuery } from "usehooks-ts";
import { Background } from "./Background/Background";
import Identity, { encodeIdentityCommitment } from "./Identity/Identity";
import Initial from "./Initial/Initial";

const App = React.memo(function App() {
  const { getIdentity } = useIdentityStorage();
  const isMobile = useMediaQuery("(max-width: 499px)");
  const isDark = useMediaQuery("(prefers-color-scheme: dark)");

  const [identity, setIdentity] = React.useState<IdentityType>({
    id: "",
    verified: false,
    inclusionProof: null,
    commitment: BigInt("0000"),
    trapdoor: BigInt("0000"),
    nullifier: BigInt("0000"),
  });

  React.useLayoutEffect(() => {
    const storedIdentity = getIdentity();

    if (!storedIdentity) {
      setPhase(Phase.Initial);
      return;
    }

    let verified = false;
    let proof: IdentityType["inclusionProof"] = null;
    inclusionProof(encodeIdentityCommitment(storedIdentity.commitment))
      .then((result) => {
        verified = true;
        proof = result;
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setIdentity({
          ...identity,
          ...storedIdentity,
          verified,
          inclusionProof: proof,
        });
        setPhase(Phase.Identity);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps -- used only on mount
  }, []);

  const [phase, setPhase] = React.useState<Phase>(Phase.Loading);

  const [verificationSkipped, setVerificationSkipped] = React.useState(
    identity.verified ? true : false,
  );

  React.useEffect(() => {
    if (identity.verified) {
      return setVerificationSkipped(true);
    }

    return setVerificationSkipped(false);
  }, [identity.verified]);

  return (
    <div className="fixed grid h-full w-full overflow-y-scroll bg-f9fbfc xs:min-h-screen">
      <Background
        className="fixed h-screen w-full"
        phase={phase}
      />

      <div
        className={cn(
          "z-10 col-start-1 row-start-1 w-full max-w-[290px] content-start gap-y-8 pl-8 pt-8 lg:grid",
          "hidden",
        )}
      >
        <Icon
          data={logoSvg}
          className="h-10 w-10"
        />
        <p className="w-full text-777e90">
          This is a simulator of the{" "}
          <a
            href="https://worldcoin.org/download"
            target="_blank"
            className="text-4940e0"
            rel="noreferrer"
          >
            Worldcoin app
          </a>{" "}
          intended for testing World ID.
        </p>
        <div>
          <a
            href="https://docs.worldcoin.org/test"
            target="_blank"
            className="text-4940e0"
            rel="noreferrer"
          >
            Read the docs
          </a>
          .
        </div>
      </div>

      <section
        className={cn(
          "h-full w-full p-4 pb-8 xs:h-[812px] xs:w-[375px] xs:overflow-hidden xs:rounded-40 xs:border-4 xs:border-183c4a",
          "relative col-start-1 row-start-1 grid grid-rows-auto/1fr self-center justify-self-center",
          "gap-y-3 bg-ffffff transition duration-500 dark:bg-0c0e10 xs:[zoom:.9] md:[zoom:initial]",
          { "xs:grid-rows-auto/1fr/auto": phase !== Phase.Identity },
          { "pb-7 xs:grid-rows-auto/1fr": phase === Phase.Identity },
        )}
      >
        <header className="z-10 grid grid-cols-1fr/auto px-4">
          <div className="col-span-2 hidden grid-flow-col content-center justify-between xs:grid">
            <span
              className={cn(
                "font-sora font-semibold leading-none text-191c20 transition-colors dark:text-ffffff",
              )}
            >
              9:41
            </span>
            <div className="grid grid-flow-col items-center justify-center gap-x-1">
              <Icon
                data={networkSvg}
                className="z-50 h-[14px] w-5 text-191c20 transition-colors dark:text-ffffff"
              />
              <Icon
                data={wifiSvg}
                className="z-50 h-[14px] w-4 text-191c20 transition-colors dark:text-ffffff"
              />
              <Icon
                data={batterySvg}
                className="z-50 h-[14px] w-[25px] text-191c20 transition-colors dark:text-ffffff"
              />
            </div>
          </div>
        </header>

        {phase === Phase.Loading && (
          <div className="grid h-full content-center justify-center">
            <Icon
              data={spinnerSvg}
              className="h-16 w-16 animate-spin text-4940e0"
            />
          </div>
        )}

        {(phase === Phase.Initial || phase === Phase.Signature) && (
          <Initial
            phase={phase}
            setPhase={setPhase}
            className="z-10 mt-3.5"
            identity={identity}
            setIdentity={setIdentity}
          />
        )}

        {phase === Phase.Identity && (
          <Identity
            phase={phase}
            setPhase={setPhase}
            identity={identity}
            verificationSkipped={verificationSkipped}
            setIdentity={setIdentity}
            setVerificationSkipped={setVerificationSkipped}
          />
        )}

        <hr
          className={cn(
            "mb-2 hidden h-1 w-full max-w-[134px] justify-self-center rounded-full border-none bg-000000/20",
            { "xs:block": phase !== Phase.Identity },
          )}
        />
      </section>

      <ToastContainer
        position={isMobile ? "bottom-center" : "top-right"}
        autoClose={3500}
        hideProgressBar
        pauseOnHover
        theme={isDark ? "dark" : "light"}
        closeButton={({ closeToast }) => (
          <button
            className="border-l border-f0edf9 p-4"
            onClick={closeToast}
          >
            <Icon
              data={crossSvg}
              className="h-5 w-5 text-191c20 dark:text-ffffff"
            />
          </button>
        )}
      />
    </div>
  );
});

export default App;
