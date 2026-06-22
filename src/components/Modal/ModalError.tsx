import { ErrorsCode } from "@/types";
import { Icon } from "../Icon";

const DEVELOPER_PORTAL_URL = "https://developer.world.org";

export default function ModalError(props: {
  errorCode: ErrorsCode | null;
  close: () => void;
}) {
  if (props.errorCode == ErrorsCode.InputError) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center">
        <button
          className="absolute right-5 top-5 flex w-full justify-end"
          onClick={props.close}
        >
          <Icon
            name="close"
            className="size-6 text-black"
            bgClassName="h-9 w-9 rounded-full bg-gray-200"
          />
        </button>
        <Icon
          name="qr-code"
          className="size-10"
          bgClassName="h-20 w-20 rounded-full bg-gray-400"
          noMask
        />
        <h2 className="mt-4 text-h2 font-bold text-gray-900">
          Expired QR Code
        </h2>
        <p className="mt-4 text-center text-gray-500">
          This connection has expired <br></br> Please try a different code.
        </p>
      </div>
    );
  } else if (props.errorCode == ErrorsCode.MissingAction) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center px-8">
        <button
          className="absolute right-5 top-5 flex w-full justify-end"
          onClick={props.close}
        >
          <Icon
            name="close"
            className="size-6 text-black"
            bgClassName="h-9 w-9 rounded-full bg-gray-200"
          />
        </button>
        <Icon
          name="warning"
          className="size-10 text-white"
          bgClassName="h-16 w-16 rounded-full bg-error-700"
        />
        <h2 className="mt-4 text-center text-h2 font-bold text-gray-900">
          Action Required
        </h2>
        <p className="mt-4 text-center text-gray-500">
          No action found for this app.
          <br></br>
          Create one in the Developer Portal.
        </p>
        <a
          className="mt-4 text-b3 font-medium text-info-700 underline"
          href={DEVELOPER_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          developer.world.org
        </a>
      </div>
    );
  } else if (props.errorCode == ErrorsCode.AppNotRegisteredV4) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center px-8">
        <button
          className="absolute right-5 top-5 flex w-full justify-end"
          onClick={props.close}
        >
          <Icon
            name="close"
            className="size-6 text-black"
            bgClassName="h-9 w-9 rounded-full bg-gray-200"
          />
        </button>
        <Icon
          name="warning"
          className="size-10 text-white"
          bgClassName="h-16 w-16 rounded-full bg-error-700"
        />
        <h2 className="mt-4 text-center text-h2 font-bold text-gray-900">
          App Not Found
        </h2>
        <p className="mt-4 text-center text-gray-500">
          Please create this app in the dev portal.
        </p>
        <a
          className="mt-4 text-b3 font-medium text-info-700 underline"
          href={DEVELOPER_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          developer.world.org
        </a>
      </div>
    );
  } else if (props.errorCode == ErrorsCode.VerificationLevelNotSatisfied) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center px-8">
        <button
          className="absolute right-5 top-5 flex w-full justify-end"
          onClick={props.close}
        >
          <Icon
            name="close"
            className="size-6 text-black"
            bgClassName="h-9 w-9 rounded-full bg-gray-200"
          />
        </button>
        <Icon
          name="warning"
          className="size-10 text-white"
          bgClassName="h-16 w-16 rounded-full bg-error-700"
        />
        <h2 className="mt-4 text-center text-h2 font-bold text-gray-900">
          Credential not accepted
        </h2>
        <p className="mt-4 text-center text-gray-500">
          This identity can&apos;t produce a proof that satisfies the requested
          verification level. The app was sent a rejection.
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
            className="size-6 text-black"
            bgClassName="h-9 w-9 rounded-full bg-gray-200"
          />
        </button>
        <Icon
          name="warning"
          className="size-10 text-white"
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
