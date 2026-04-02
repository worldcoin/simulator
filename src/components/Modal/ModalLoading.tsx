import { Icon } from "../Icon";

export default function ModalLoading() {
  return (
    <div className="flex h-[360px] items-center justify-center">
      <Icon
        name="spinner"
        className="size-8 animate-spin text-gray-500"
      />
    </div>
  );
}
