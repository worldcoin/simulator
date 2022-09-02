import { validateImageUrl } from "@/common/helpers";
import { Icon } from "@/common/Icon";
import { WalletProviderContext } from "@/common/WalletProvider/WalletProvider";
import unknownSvg from "@static/unknown-wallet.svg";
import React from "react";

export const Signature = React.memo(function Signature() {
  const providerContext = React.useContext(WalletProviderContext);
  const [icon, setIcon] = React.useState<string>("");

  const provider = React.useMemo(
    () => providerContext.provider,
    [providerContext.provider],
  );

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
    <div className="grid gap-y-12">
      <p className="text-center text-858494">
        We’ve established a connection to your{" "}
        <span className="text-4940e0">
          {provider?.walletMeta?.name ?? "wallet"}
        </span>
        , now please confirm the signature request so we can generate your World
        ID identity.
      </p>

      <div className="grid w-full rounded-12 bg-f1f5f8 p-4">
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

          <span className="font-semibold text-858494">
            Confirming Signature
            <span className="animate-pulse-short">.</span>
            <span className="animate-pulse-short-delay-300">.</span>
            <span className="animate-pulse-short-delay-300">.</span>
          </span>
        </div>
      </div>
    </div>
  );
});
