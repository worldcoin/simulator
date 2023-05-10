import { Icon } from "./Icon";

export default function Confirm(props: { isConfirmed: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <Icon
        name="shield"
        className="h-10 w-10 text-4940e0"
        bgClassName="w-20 h-20 rounded-full bg-f0f0fd"
      />
      <h1 className="mt-8 font-sora text-30 font-semibold text-191c20">
        Confirm signature request
      </h1>
      <p className="mt-4 font-rubik text-18 text-657080">
        Please confirm the signature request in your wallet to generate your
        World ID identity.
      </p>
      <div className="absolute bottom-12 flex items-center">
        {!props.isConfirmed && (
          <>
            <Icon
              name="spinner"
              className="h-6 w-6 animate-spin text-000000"
            />
            <span className="ml-2 text-16 font-semibold text-657080">
              Confirmation pending
            </span>
          </>
        )}
        {props.isConfirmed && (
          <>
            <Icon
              name="checkmark"
              className="h-4 w-4 text-ffffff "
              bgClassName="rounded-full w-6 h-6 bg-00c313"
            />
            <span className="ml-2 text-16 font-semibold text-00c313">
              Confirmed
            </span>
          </>
        )}
      </div>
    </div>
  );
}
