import Button from "@/components/Button";
import useIdentity from "@/hooks/useIdentity";
import { useModalStore } from "@/stores/modalStore";
import { useUiStore, type UiStore } from "@/stores/ui";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "../Dialog";
import { Input } from "../Input";

const getUiStore = (store: UiStore) => ({
  qrInputOpened: store.qrInputOpened,
  setQrInputOpened: store.setQrInputOpened,
});

export const QRInput = memo(function QRInput(props: {
  performVerification: (uri: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { open } = useModalStore();
  const { qrInputOpened, setQrInputOpened } = useUiStore(getUiStore);
  useIdentity();

  const close = useCallback(() => setQrInputOpened(false), [setQrInputOpened]);

  const isTextInvalidQRInput = (uri: string) => {
    if (!uri) return false;
    try {
      const url = new URL(uri);

      return !(
        url.protocol == "https:" &&
        (url.host == "worldcoin.org" ||
          url.host == "world.org" ||
          url.host == "staging.world.org") &&
        url.pathname == "/verify" &&
        url.searchParams.get("t") == "wld" &&
        url.searchParams
          .get("i")
          ?.match(
            /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/,
          ) &&
        url.searchParams.get("k")?.match(/[^&]*/)
      );
    } catch (e) {
      return true;
    }
  };

  const isInvalid = useMemo(() => {
    return isTextInvalidQRInput(value);
  }, [value]);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const data = event.target.value;
    if (data || data === "") setValue(data);
  };

  useEffect(() => {
    if (value && !isInvalid) {
      setIsSubmitting(true);

      props
        .performVerification(value)
        .then(() => {
          setIsSubmitting(false);
          close();
        })
        .catch((e) => console.error(e));
    }
  }, [value, isInvalid, props, close]);

  const handleSubmit = async (
    event:
      | React.MouseEvent<HTMLAnchorElement | HTMLButtonElement, MouseEvent>
      | undefined,
  ) => {
    if (event) event.preventDefault();
    setIsSubmitting(true);
    await props.performVerification(value);
    setIsSubmitting(false);
  };

  // Close input once modal opens
  useEffect(() => {
    if (open) {
      close();
    }
  }, [close, open]);

  // Clear input once dialog is closed
  useEffect(() => {
    if (!qrInputOpened) {
      setValue("");
    }
  }, [qrInputOpened]);

  const handlePaste = () => {
    navigator.clipboard.readText().then(
      (text) => setValue(text),
      (error) => {
        console.error(error);
      },
    );
  };

  return (
    <Dialog
      open={qrInputOpened}
      onClose={close}
      closeIcon="chevron-left"
      closeLabel="Back"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 pt-3">
        <div className="flex flex-col gap-3">
          <h1 className="text-h2 text-fg-primary">Paste code</h1>
          <p className="text-b1 text-fg-secondary">
            Tap the IDKit QR code to copy its link to your clipboard, then paste
            it here.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Input
            placeholder="https://world.org/verify?t=wld&i=…"
            invalid={isInvalid}
            value={value}
            onChange={(e) => void handleChange(e)}
            autoComplete="off"
            spellCheck={false}
            renderButton={({ isEmpty }) => (
              <Button
                variant="tertiary"
                size={36}
                onClick={() => (isEmpty ? handlePaste() : setValue(""))}
              >
                {isEmpty ? "Paste" : "Clear"}
              </Button>
            )}
          />

          {isInvalid && (
            <p
              className="text-b3 text-status-error"
              role="alert"
            >
              This isn&apos;t a valid World ID QR code link.
            </p>
          )}
        </div>

        <div className="mt-auto">
          <Button
            type="submit"
            fullWidth
            isDisabled={isInvalid || !value}
            isLoading={isSubmitting}
            onClick={(e) => void handleSubmit(e)}
          >
            Continue
          </Button>
        </div>
      </div>
    </Dialog>
  );
});
