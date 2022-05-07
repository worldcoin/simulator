import Button from "@/common/Button/Button";
import { Icon } from "@/common/Icon";
import { insertIdentity } from "@/lib/sequencer-service";
import arrowSvg from "@static/arrow-right.svg";
import checkmarkSvg from "@static/checkmark.svg";
import errorSvg from "@static/error.svg";
import logoFullSvg from "@static/logo-full.svg";
import spinnerSvg from "@static/spinner.svg";
import cn from "classnames";
import React from "react";
import { useLocation } from "react-router-dom";

const IdentityFaucet = React.memo(function IdentityFaucet() {
  const location = useLocation();

  const identityCommitment = React.useMemo(
    () => new URLSearchParams(location.search).get("commitment") ?? "",
    [location.search],
  );

  const [input, setInput] = React.useState<string>(identityCommitment);
  const [submitSuccess, setSubmitSuccess] = React.useState<boolean | null>(
    null,
  );
  const [loading, setLoading] = React.useState<boolean>(false);

  const addIdentity = React.useCallback(async () => {
    try {
      setLoading(true);

      const result = await insertIdentity(input);
      console.info("Identity successfully added.", result);

      setSubmitSuccess(true);
    } catch (err) {
      setSubmitSuccess(false);
      console.error("Error inserting identity.", err);
    } finally {
      setLoading(false);
    }
  }, [input]);

  const onInput = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setInput(event.target.value),
    [],
  );

  //TODO update go back logic
  const goBack = React.useCallback(() => {
    window.close();
  }, []);

  return (
    <div className="relative grid animate-fade-in-short grid-rows-auto/1fr gap-y-9 p-4 sm:px-0">
      <header className="justify-self-center sm:justify-self-auto sm:pl-8 sm:pt-8">
        <Icon
          data={logoFullSvg}
          className="h-6 w-36 text-183c4a"
        />
      </header>

      <div className="sm:self-center sm:pl-32">
        <div className="grid gap-y-6 sm:max-w-[465px]">
          <h1 className="text-24 font-semibold text-183c4a sm:text-40">
            World ID Identity Faucet
          </h1>
          <div className="grid gap-y-4 text-14 leading-snug tracking-[-0.01em] text-777e90 sm:text-16">
            <div className="">
              <div>
                <span>Need some extra identities for trying out</span>
                <span className="font-semibold text-4940e0"> World ID?</span>
              </div>
              <p>
                Use the form below to include mock identities into our testnet.
              </p>
            </div>
            <p>
              When you add your identity you will be able to sign World ID
              verification requests.
            </p>
            <p className="text-ff6471">
              Please note that verified identities will{" "}
              <b>only be valid for ~1 hour</b>. Add the identity here again to
              keep using it.
            </p>
          </div>

          <div className="mt-2 grid gap-y-2">
            <input
              type="text"
              placeholder="Paste your identity commit here"
              onInput={onInput}
              className={cn(
                "w-full rounded-12 border bg-f9f9f9 py-4.5 px-4 outline-none",
                {
                  "border-f1f2f2":
                    submitSuccess === null || submitSuccess === true,
                },
                { "border-ff6471": submitSuccess === false },
              )}
              defaultValue={identityCommitment}
            />
            <div className="grid grid-cols-1fr/auto items-center gap-x-2 justify-self-start">
              <span
                className={cn(
                  "text-12 leading-none transition-colors",
                  { "text-bbbec7": submitSuccess === null },
                  { "text-ff6471": submitSuccess === false },
                  { "text-4940e0": submitSuccess === true },
                )}
              >
                {submitSuccess === null &&
                  "Obtained from the mock Worldcoin app"}
                {submitSuccess === true &&
                  "Your identity was successfully added!"}
                {submitSuccess === false &&
                  "Looks like something went wrong, please check the console and try again."}
              </span>

              {submitSuccess !== null && (
                <Icon
                  data={submitSuccess ? checkmarkSvg : errorSvg}
                  className={cn(
                    "h-4 w-4",
                    { "text-ff6471": submitSuccess === false },
                    { "text-4940e0": submitSuccess === true },
                  )}
                />
              )}
            </div>
          </div>

          <div className="grid gap-y-8">
            <Button
              type="button"
              onClick={addIdentity}
              className="w-full rounded-full bg-4940e0 text-16 text-ffffff hover:bg-4940e0/90"
            >
              {!loading &&
                (submitSuccess === false
                  ? "Try again"
                  : "Add identity to test network")}
              {loading && (
                <Icon
                  data={spinnerSvg}
                  className="mx-auto h-5 w-5 animate-spin text-ffffff"
                />
              )}
            </Button>

            <button
              type="button"
              onClick={goBack}
              className={cn(
                "flex justify-self-center transition-visibility/opacity",
                {
                  "pointer-events-none invisible select-none opacity-0":
                    submitSuccess === null,
                },
              )}
            >
              <span className="mr-2 text-4940e0">Back to app</span>
              <Icon
                data={arrowSvg}
                className="h-5 w-5 text-4940e0"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default IdentityFaucet;
