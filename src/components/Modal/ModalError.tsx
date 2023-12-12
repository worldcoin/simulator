import { Errors } from "@/types";
import { Icon } from "../Icon";

export default function ModalError(props: {
  errorCode: Errors;
  close: () => void;
}) {
  if (props.errorCode != Errors.InputError) {
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
        <h2 className="mt-4 text-h2 font-bold text-gray-900">
          Expired QR Code
        </h2>
        <p className="mt-4 text-center text-gray-500">
          This connection has expired <br></br> Please try a different code.
        </p>
      </div>
    );
  } else {
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
          name="warning"
          className="h-10 w-10 text-white"
          bgClassName="h-16 w-16 rounded-full bg-error-700"
        />
        <h2 className="mt-4 text-h2 font-bold text-gray-900">Error</h2>
        <p className="mt-4 text-center text-gray-500">
          Something went wrong <br></br> Please try again later.
        </p>
      </div>
    );
  }
}
