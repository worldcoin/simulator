import Button from "@/common/Button/Button";
import { validateImageUrl } from "@/common/helpers";
import { Icon } from "@/common/Icon";
import { WalletProviderContext } from "@/common/WalletProvider/WalletProvider";
import { Phase } from "@/types";
import spinnerSvg from "@static/spinner.svg";
import unknownSvg from "@static/unknown-wallet.svg";
import cn from "classnames";
import React from "react";

const Signature = React.memo(function Signature(props: {
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  className?: string;
}) {
  const providerContext = React.useContext(WalletProviderContext);
  const [icon, setIcon] = React.useState<string>("");

  const provider = React.useMemo(
    () => providerContext.provider,
    [providerContext.provider],
  );

  const goBack = React.useCallback(() => {
    if (!provider) {
      return console.error("Provider was not created");
    }
    provider.disconnect().catch(console.error.bind(console));

    provider.connector.on("disconnect", () => {
      console.log("Provider disconnected by user");
      props.setPhase(Phase.Initial);
    });
  }, [props, provider]);

  React.useEffect(() => {
    if (provider?.walletMeta?.icons && provider.walletMeta.icons.length > 0) {
      const result = provider.walletMeta.icons.find((iconUrl) => {
        return validateImageUrl(iconUrl);
      });

      if (result) {
        return setIcon(result);
      }
    }
  }, [provider]);

  const onError = React.useCallback(() => {
    console.error("Unable to set wallet icon");
    setIcon("");
  }, []);

  return (
    <div
      className={cn(
        "z-10 grid h-full content-between gap-y-12",
        props.className,
      )}
    >
      <div className="grid gap-y-6">
        <h1 className="text-24 font-semibold text-183c4a">
          Confirm the signature request
        </h1>

        <div className="mt-1.5 text-777e90">
          <span>{`We’ve established a connection to your `}</span>
          <span className="font-semibold text-4940e0">{`${
            provider?.walletMeta?.name ?? ""
          }`}</span>
          <span>
            {`wallet, now please confirm the signature request so we can generate your
      World ID identity.`}
          </span>
        </div>

        <div className="grid w-full justify-items-center rounded-8 border border-f1f2f2 bg-ffffff p-3">
          <div className="grid grid-cols-auto/1fr items-center justify-center gap-x-4">
            {!icon && (
              <div className="rounded-full bg-0d049a p-2">
                <Icon
                  data={unknownSvg}
                  className="h-4 w-4 text-ffffff"
                />
              </div>
            )}

            {icon && (
              <img
                alt="Wallet icon"
                src={icon}
                className="h-8 w-8"
                referrerPolicy="no-referrer"
                onError={onError}
              />
            )}

            <span className="font-semibold text-bbbec7">
              Confirming Signature
              <span className="animate-pulse-short">.</span>
              <span className="animate-pulse-short-delay-300">.</span>
              <span className="animate-pulse-short-delay-300">.</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid w-full gap-y-12">
        <Icon
          data={spinnerSvg}
          className="pointer-events-none h-8 w-8 animate-spin justify-self-center text-4940e0"
        />

        <Button
          onClick={goBack}
          className="w-full rounded-full border border-183c4a text-183c4a"
        >
          Cancel and go back
        </Button>
      </div>
    </div>
  );
});

export default Signature;
