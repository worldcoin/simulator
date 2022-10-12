import Button from "@/common/Button/Button";
import React from "react";

const QrInput = React.memo(function QrInput(props: {
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  onInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste: (event: React.ClipboardEvent) => void;
}) {
  const closeModal = React.useCallback(() => {
    props.setIsModalVisible(false);
  }, [props]);

  return (
    <div className="grid grid-flow-row">
      <h2 className="my-6 text-center font-sora text-26 font-semibold text-000000 dark:text-ffffff">
        Enter or paste QR
      </h2>
      <input
        className="mb-4 w-full rounded-10 border border-191c20 p-4 text-center text-000000 dark:bg-191c20 dark:text-ffffff"
        onInput={props.onInput}
        onPaste={props.onPaste}
      />
      <Button
        onClick={closeModal}
        className="mt-1.5 self-center font-medium text-858494 hover:opacity-70"
      >
        Dismiss
      </Button>
    </div>
  );
});

export default QrInput;
