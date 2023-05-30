import { Icon } from "../Icon";

export default function ModalEnvironment() {
  return (
    <div className="flex h-[360px] flex-col items-center justify-center">
      <Icon
        name="close"
        className="h-10 w-10 text-error-700"
        bgClassName="h-12 w-12 rounded-full bg-error-100"
      />
      <h3 className="mt-4 text-center font-sora text-h3 font-semibold">
        Cannot verify production app on simulator
      </h3>
    </div>
  );
}
