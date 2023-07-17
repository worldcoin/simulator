import Button from "@/components/Button";
import useIdentity from "@/hooks/useIdentity";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/stores/modalStore";
import { memo, useEffect, useMemo, useState } from "react";
import { Drawer } from "../Drawer";
import { Input } from "../Input";

export const QRInput = memo(function QRInput(props: {
  open: boolean;
  onClose: () => void;
  performVerification: (uri: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const { activeIdentity } = useIdentity();
  const { open } = useModalStore();

  const isInvalid = useMemo(() => {
    if (!value) return false;
    try {
      const url = decodeURIComponent(value);
      const regex =
        /^https:\/\/worldcoin\.org\/verify\?w=wc:[a-zA-Z0-9]{64}@2\?relay-protocol=irn&symKey=[a-zA-Z0-9]{64}$/;
      return url.match(regex) === null;
    } catch (e) {
      return true;
    }
  }, [value]);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const data = event.target.value;
    if (data || data === "") setValue(data);
  };

  const handlePaste = async (event: React.ClipboardEvent) => {
    const data = event.clipboardData.getData("Text");
    await props.performVerification(data);
  };

  const handleSubmit = async (
    event:
      | React.MouseEvent<HTMLAnchorElement | HTMLButtonElement, MouseEvent>
      | undefined,
  ) => {
    if (event) event.preventDefault();
    await props.performVerification(value);
  };

  // // On initial load, get identity from session storage
  // useEffect(() => {
  //   if (identity) return;
  //   void retrieveIdentity();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // Close input once modal opens
  useEffect(() => {
    if (open) {
      props.onClose();
    }
  }, [open, props]);

  // Clear input once dialog is closed
  useEffect(() => {
    if (!props.open) {
      setValue("");
    }
  }, [props.open]);

  return (
    <Drawer
      open={props.open}
      onClose={props.onClose}
    >
      <div className="py-3 text-center font-sora text-h2">
        Enter or paste
        <br />
        QR code
      </div>

      <div className="mt-4 text-center text-b1 text-gray-500">
        Tap the IDKit QR code to copy it to your clipboard, then paste it below.
      </div>

      <Input
        className="mt-8"
        placeholder="QR code"
        invalid={isInvalid}
        value={value}
        onPaste={(e) => void handlePaste(e)}
        onChange={(e) => void handleChange(e)}
        renderButton={({ isEmpty, isFocused, isInvalid }) => (
          <>
            <button
              className={cn("h-10 rounded-10 px-3 text-12 font-medium", {
                "bg-white": !isInvalid && !isFocused,
                "bg-gray-100": !isInvalid && isFocused,
                "text-gray-500": !isInvalid,
                "bg-error-700 text-white": isInvalid,
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

      {isInvalid && (
        <div className="mt-2 text-b3 text-error-700">
          The QR code is not valid
        </div>
      )}

      <Button
        type="submit"
        className="mt-8 h-14 w-full bg-gray-900 text-white disabled:bg-gray-100 disabled:text-gray-300"
        isDisabled={isInvalid || !value}
        onClick={(e) => void handleSubmit(e)}
      >
        Submit
      </Button>
    </Drawer>
  );
});
