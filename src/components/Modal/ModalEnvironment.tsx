import { Icon } from "../Icon";

export default function ModalEnvironment() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-2 text-center">
      <Icon
        name="warning"
        className="size-10 text-error-700"
        bgClassName="h-14 w-14 rounded-full bg-error-100"
      />
      <h3 className="mt-5 font-sora text-h3 font-semibold text-gray-900">
        Production request detected
      </h3>
      <p className="mt-3 font-sora text-b3 text-gray-500">
        This simulator only accepts staging requests.
      </p>
      <p className="mt-2 font-sora text-b3 text-gray-500">
        Set{" "}
        <code className="rounded-8 bg-gray-100 px-2 py-1 text-gray-900">
          environment: &quot;staging&quot;
        </code>
      </p>
      <p className="mt-2 font-sora text-b3 text-gray-500">
        in your request payload.
      </p>
      <p className="mt-5 font-sora text-b4 text-gray-400">
        Update the request and try again.
      </p>
    </div>
  );
}
