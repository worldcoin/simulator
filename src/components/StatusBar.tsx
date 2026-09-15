import { Icon } from "./Icon";

/** Fake iOS status bar shown inside the phone frame on larger screens. */
export default function StatusBar() {
  return (
    <header className="z-40 grid grid-cols-1fr/auto px-4">
      <div className="col-span-2 hidden h-6 grid-flow-col content-center justify-between xs:grid">
        <span className="text-s1 font-semibold leading-none text-fg-primary">
          9:41
        </span>
        <div className="grid grid-flow-col items-center justify-center gap-x-1 text-fg-primary">
          <Icon
            name="network"
            className="h-[14px] w-5"
          />
          <Icon
            name="wifi"
            className="h-[14px] w-4"
          />
          <Icon
            name="battery"
            className="h-[14px] w-[25px]"
          />
        </div>
      </div>
    </header>
  );
}
