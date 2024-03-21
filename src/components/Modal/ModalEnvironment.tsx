import Button from "../Button";
import { Icon } from "../Icon";

export default function ModalEnvironment() {
  return (
    <>
      <div className="flex h-48 flex-col items-center justify-center">
        <Icon
          name="close"
          className="h-10 w-10 text-error-700"
          bgClassName="h-12 w-12 rounded-full bg-error-100"
        />
        <h3 className="mt-4 text-center font-sora text-h3 font-semibold">
          The Simulator is only for use with staging applications.
        </h3>
        <p className="mt-2 text-center font-sora font-medium">
          Use World App to verify for a production application.
        </p>
      </div>
      <Button
        onClick={() =>
          window.open("https://worldcoin.org/download?worldid=true")
        }
        className="mt-6 flex h-14 w-full items-center justify-center self-end bg-gray-900 font-sora text-16 font-semibold text-white"
      >
        <Icon
          name="smart-phone"
          className="h-6 w-6 text-white"
        />
        <span className="mx-2">Download World App</span>
      </Button>
    </>
  );
}
