import { Icon } from "../Icon";
import ModalEnvironment from "./ModalEnvironment";

export default function ModalError(props: {
  errorCode: string;
  close: () => void;
}) {
  if (props.errorCode == "input_error") {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center">
        <button
          className="absolute right-5 top-5 flex w-full justify-end"
          onClick={props.close}
        >
          <Icon
            name="close"
            className="h-6 w-6 text-black"
            bgClassName="h-9 w-9 rounded-full bg-gray-200"
          />
        </button>
        <Icon
          name="qr-code"
          className="h-10 w-10 text-white"
          bgClassName="h-20 w-20 rounded-full bg-gray-400"
        />
        <h2 className="mt-4 text-h2 font-bold">Expired QR Code</h2>
        <p className="mt-4 text-center">
          This code has expired <br></br> Please try to use a different one.
        </p>
      </div>
    );
  } else {
    return <ModalEnvironment />;
  }
}
