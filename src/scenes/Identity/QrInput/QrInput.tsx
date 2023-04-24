import Button from "@/common/Button/Button";
import { parseWorldIDQRCode } from "@/common/helpers";
import { Icon } from "@/common/Icon";
import React, { Fragment } from "react";

const QrInput = React.memo(function QrInput(props: {
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  applyURL: (data: string) => Promise<void>;
}) {
  const [loading, setLoading] = React.useState<boolean>(false);

  const handleApplyUrl = React.useCallback(
    async (data: string, debugQrError = false) => {
      const { valid, errorMessage, uri } = parseWorldIDQRCode(data);
      setLoading(true);

      if (!valid || !uri) {
        if (debugQrError) {
          console.log(errorMessage);
        }
        setLoading(false);
        return;
      }

      try {
        await props.applyURL(uri);
      } catch (error) {
        console.log(error);
        props.setIsModalVisible(false);
      } finally {
        setLoading(false);
      }
    },
    [props],
  );

  const onPaste = React.useCallback(
    (event: React.ClipboardEvent) =>
      void handleApplyUrl(event.clipboardData.getData("Text"), true),
    [handleApplyUrl],
  );

  const onInput = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      void handleApplyUrl(event.target.value),
    [handleApplyUrl],
  );

  const closeModal = React.useCallback(() => {
    props.setIsModalVisible(false);
  }, [props]);

  return (
    <div className="grid grid-flow-row">
      <h2 className="my-6 text-center font-sora text-26 font-semibold text-000000 dark:text-ffffff">
        Enter or paste QR
      </h2>

      {!loading && (
        <Fragment>
          <input
            className="mb-4 w-full rounded-10 border border-191c20 p-4 text-center text-000000 dark:bg-191c20 dark:text-ffffff"
            onInput={onInput}
            onPaste={onPaste}
          />
        </Fragment>
      )}

      {loading && (
        <Icon
          className="h-8 w-8 animate-spin justify-self-center py-16"
          name="gradient-spinner"
          noMask
        />
      )}

      <Button
        isDisabled={loading}
        onClick={closeModal}
        className="mt-1.5 self-center font-medium text-858494 hover:opacity-70 disabled:opacity-30"
      >
        Dismiss
      </Button>
    </div>
  );
});

export default QrInput;
