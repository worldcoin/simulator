import clsx from "clsx";
import { Icon } from "./Icon";

export default function StatusBar() {
  return (
    <header className="z-10 grid grid-cols-1fr/auto px-4">
      <div className="col-span-2 hidden grid-flow-col content-center justify-between xs:grid">
        <span
          className={clsx(
            "font-sora font-semibold leading-none text-gray-900 transition-colors ",
          )}
        >
          9:41
        </span>
        <div className="grid grid-flow-col items-center justify-center gap-x-1">
          <Icon
            name="network"
            className="z-50 h-[14px] w-5 text-gray-900 transition-colors "
          />
          <Icon
            name="wifi"
            className="z-50 h-[14px] w-4 text-gray-900 transition-colors "
          />
          <Icon
            name="battery"
            className="z-50 h-[14px] w-[25px] text-gray-900 transition-colors "
          />
        </div>
      </div>
    </header>
  );
}
