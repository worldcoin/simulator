import { useIdentityStorage } from "@/common/hooks";
import { Icon } from "@/common/Icon";
import { inclusionProof } from "@/lib/sequencer-service";
import type { Identity as IdentityType } from "@/types";
import { Phase } from "@/types";
import batterySvg from "@static/battery.svg";
import bgFigureSvg from "@static/bg-figure.svg";
import logoFullSvg from "@static/logo-full.svg";
import logoSvg from "@static/logo.svg";
import logoutIconSvg from "@static/logout.svg";
import networkSvg from "@static/network.svg";
import spinnerSvg from "@static/spinner.svg";
import wifiSvg from "@static/wifi.svg";
import cn from "classnames";
import React from "react";
import { useLocation } from "react-router-dom";
import { Background } from "./Background/Background";
import Identity, { encodeIdentityCommitment } from "./Identity/Identity";
import IdentityFaucet from "./IdentityFaucet/IdentityFaucet";
import Initial from "./Initial/Initial";
import Signature from "./Signature/Signature";
import VerifyIdentity from "./VerifyIdentity/VerifyIdentity";

const App = React.memo(function App() {
  const routerLocation = useLocation();
  const { getIdentity } = useIdentityStorage();

  const [identity, setIdentity] = React.useState<IdentityType>({
    id: "",
    verified: false,
    inclusionProof: [],
    commitment: BigInt("0000"),
    trapdoor: BigInt("0000"),
    nullifier: BigInt("0000"),
  });

  React.useLayoutEffect(() => {
    const storedIdentity = getIdentity();

    if (!storedIdentity) {
      routerLocation.pathname === "/identity-faucet"
        ? setPhase(Phase.IdentityFaucet)
        : setPhase(Phase.Initial);
      return;
    }

    let verified = false;
    let proof: IdentityType["inclusionProof"] = [];
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

  const [extendedVerifyIdentity, setExtendedVerifyIdentity] =
    React.useState(false);

  const [verificationSkipped, setVerificationSkipped] = React.useState(
    identity.verified ? true : false,
  );

  React.useEffect(() => {
    if (identity.verified) {
      return setVerificationSkipped(true);
    }

    return setVerificationSkipped(false);
  }, [identity.verified]);

  const logout = React.useCallback(() => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {}
    location.reload();
  }, []);

  return (
    <div className="fixed grid h-full w-full overflow-y-scroll bg-f9fbfc xs:min-h-screen">
      <Background
        className="fixed h-screen w-full"
        phase={phase}
      />

      {phase !== Phase.IdentityFaucet && (
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
            This is a mock app that simulates the behavior of the{" "}
            <a
              href="https://worldcoin.org"
              target="_blank"
              className="text-4940e0"
              rel="noreferrer"
            >
              Worldcoin
            </a>{" "}
            app for the purposes of testing World ID.
          </p>
          <div>
            <a
              href="https://id.worldcoin.org/test"
              target="_blank"
              className="text-4940e0"
              rel="noreferrer"
            >
              Read the docs
            </a>
            .
          </div>
        </div>
      )}

      {phase !== Phase.IdentityFaucet && (
        <section
          className={cn(
            "h-full w-full px-8 pt-4 xs:h-[718px] xs:w-[387px] xs:overflow-hidden xs:rounded-40 xs:border-6 xs:border-183c4a",
            "relative col-start-1 row-start-1 grid grid-rows-auto/1fr self-center justify-self-center xs:grid-rows-auto/1fr/auto",
            "gap-y-9 transition duration-500",
            { "bg-ffffff": phase !== Phase.Identity },
            { "bg-4940e0": phase === Phase.Identity },
          )}
        >
          <div className="absolute h-full w-full overflow-hidden xs:rounded-34">
            <Icon
              data={bgFigureSvg}
              className={cn(
                "absolute min-h-[607px] min-w-[649px] object-fill transition-position delay-200 duration-500 ease-in-out",
                {
                  "right-0 -top-36 text-f9f9f9 xs:-top-28":
                    phase !== Phase.Identity,
                },
                {
                  "-right-[calc((649px_-_100vw)_/_2)] -top-36 text-0d049a/10 xs:-right-[calc((649px_-_375px)_/_2)] xs:-top-24":
                    phase === Phase.Identity,
                },
              )}
            />
          </div>

          <header
            className={cn("z-10 grid grid-cols-1fr/auto gap-y-8", {
              "text-ffffff": phase === Phase.Identity,
            })}
          >
            <div className="col-span-2 hidden grid-flow-col content-center justify-between xs:grid">
              <span
                className={cn(
                  "font-medium leading-none transition-colors",
                  {
                    "text-191c20":
                      phase === Phase.Initial || phase === Phase.VerifyIdentity,
                  },
                  { "text-ffffff": phase === Phase.Identity },
                )}
              >
                9:41
              </span>
              <div className="grid grid-flow-col items-center justify-center gap-x-1">
                <Icon
                  data={networkSvg}
                  className="z-50 h-[14px] w-5 transition-colors"
                />
                <Icon
                  data={wifiSvg}
                  className="z-50 h-[14px] w-4 transition-colors"
                />
                <Icon
                  data={batterySvg}
                  className="z-50 h-[14px] w-[25px] transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1fr/auto">
              <Icon
                data={logoFullSvg}
                className={cn(
                  "col-span-2 col-start-1 row-start-1 h-6 w-36 justify-self-center",
                  { "text-183c4a": phase === Phase.VerifyIdentity },
                )}
              />

              {identity.id && phase !== Phase.Initial && (
                <button
                  onClick={logout}
                  className="col-start-2 row-start-1 transition-opacity hover:opacity-70"
                >
                  <Icon
                    data={logoutIconSvg}
                    className="h-6 w-6"
                  />
                </button>
              )}
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

          {phase === Phase.Initial && (
            <Initial
              setPhase={setPhase}
              className="z-10 mt-3.5"
              identity={identity}
              setIdentity={setIdentity}
            />
          )}

          {phase === Phase.Identity && (
            <Identity
              setPhase={setPhase}
              className="z-20"
              identity={identity}
              setExtendedVerifyIdentity={setExtendedVerifyIdentity}
              verificationSkipped={verificationSkipped}
            />
          )}

          {phase === Phase.VerifyIdentity && (
            <VerifyIdentity
              extended={extendedVerifyIdentity}
              setPhase={setPhase}
              className="z-30 pt-3.5 pb-6 xs:pb-0"
              setVerificationSkipped={setVerificationSkipped}
              identity={identity}
            />
          )}

          {phase === Phase.Signature && (
            <Signature
              className="pb-6 xs:pb-0"
              setPhase={setPhase}
            />
          )}
          <hr
            className={cn(
              "mb-2 hidden h-1 w-full max-w-[134px] justify-self-center rounded-full border-none xs:block",
              { "bg-ffffff": phase === Phase.Identity },
              { "bg-000000/20": phase !== Phase.Identity },
            )}
          />
        </section>
      )}

      {phase === Phase.IdentityFaucet && <IdentityFaucet />}
    </div>
  );
});

export default App;
