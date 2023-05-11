import Button from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Input } from "@/components/Input";
import useIdentity from "@/hooks/useIdentity";
import { parseWorldIDQRCode } from "@/lib/validation";
import {
  client,
  createClient,
  onSessionDisconnect,
  onSessionProposal,
  onSessionRequest,
  pairClient,
} from "@/services/walletconnect";
import clsx from "clsx";
import React, { useEffect } from "react";

export const QrInput = React.memo(function QrInput(props: {
  open: boolean;
  onClose: () => void;
}) {
  const [value, setValue] = React.useState("");

  const { identity, retrieveIdentity, encodeIdentityCommitment } =
    useIdentity();

  // const isInvalid = React.useMemo(() => {
  //   return !!value; // FIXME: implement validation
  // }, [value]);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    },
    [],
  );

  const handleSubmit = React.useCallback(() => {
    console.log("submit", value); // FIXME: implement submitting
  }, [value]);

  const handleOnPaste = async (event: React.ClipboardEvent) => {
    const data = event.clipboardData.getData("Text");
    const { uri } = parseWorldIDQRCode(data);
    console.log("🚀 ~ file: index.tsx:44 ~ handleOnPaste ~ uri:", uri);

    if (identity) {
      await createClient(identity);

      client.on("session_proposal", onSessionProposal);
      client.on("session_request", onSessionRequest);
      client.on("session_delete", onSessionDisconnect);

      if (uri) {
        await pairClient(uri);
      }
    }

    return {};
  };

  // On initial load, get identity from session storage
  useEffect(() => {
    if (identity) return;
    void retrieveIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
    >
      <div className="mt-9 pt-9 text-center font-sora text-h2">
        Enter or paste
        <br />
        QR code
      </div>

      <div className="mt-4 text-center text-b1 text-gray-500">
        Verify your randomly generated phone number for World ID simulator.
      </div>

      <Input
        className="mt-8"
        placeholder="QR code"
        // invalid={isInvalid}
        value={value}
        onChange={handleChange}
        onPaste={handleOnPaste}
        renderButton={({ isEmpty, isFocused, isInvalid }) => (
          <>
            <button
              className={clsx("h-10 rounded-10 px-3 text-12 font-medium", {
                "bg-ffffff": !isInvalid && !isFocused,
                "bg-gray-100": !isInvalid && isFocused,
                "text-gray-500": !isInvalid,
                "bg-ff5a76 text-ffffff": isInvalid,
              })}
              onClick={() => {
                if (isEmpty) {
                  navigator.clipboard.readText().then(
                    (text) => {
                      setValue(text);
                    },
                    (error) => {
                      console.error(error);
                    },
                  );
                } else {
                  setValue("");
                }
              }}
            >
              {isEmpty && "PASTE"}
              {!isEmpty && "CLEAR"}
            </button>
          </>
        )}
      />

      {/* {isInvalid && (
        <div className="mt-2 text-b3 text-ff5a76">The QR code is not valid</div>
      )} */}

      <Button
        className="mt-8 h-14 w-full bg-gray-900 text-ffffff disabled:bg-gray-100 disabled:text-gray-300"
        // isDisabled={isInvalid}
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </Dialog>
  );
});
