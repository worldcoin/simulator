import { Icon } from "@/common/Icon";
import React from "react";

export const Signature = React.memo(function Signature() {
  const [icon, setIcon] = React.useState<string>("");

  const onError = React.useCallback(() => {
    console.error("Unable to set wallet icon");
    setIcon("");
  }, []);

  return (
    <div className="grid gap-y-12">
      <p className="text-858494 text-center">
        We’ve established a connection to your wallet, now please confirm the
        signature request so we can generate your World ID identity.
      </p>

      <div className="rounded-12 bg-f1f5f8 dark:bg-3c4040 grid w-full p-4">
        <div className="grid-cols-auto/1fr grid items-center justify-center gap-x-4">
          {!icon && (
            <div className="bg-0d049a rounded-full p-2">
              <Icon
                name="unknown-wallet"
                className="text-ffffff h-4 w-4"
              />
            </div>
          )}

          {icon && (
            // FIXME
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Wallet icon"
              src={icon}
              className="h-8 w-8"
              referrerPolicy="no-referrer"
              onError={onError}
            />
          )}

          <span className="text-858494 dark:text-ffffff font-semibold">
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
