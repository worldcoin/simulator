import { Icon } from "./Icon";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Icon
        name="spinner"
        className="h-8 w-8 animate-spin text-black"
      />
      <span className="mt-4 text-16 font-semibold text-gray-500">
        Loading, please wait...
      </span>
    </div>
  );
}
