import { Icon } from "@/components/Icon";
import useIdentity from "@/hooks/useIdentity";
import dynamic from "next/dynamic";

const DynamicList = dynamic(() => import("@/components/SelectID/IDsList"), {
  ssr: false,
});

export default function Select() {
  const { generateNextIdentity } = useIdentity();

  return (
    <div className="mt-12 flex flex-col pb-6 text-center xs:pb-0">
      <div className="flex h-full max-h-full flex-col overflow-y-scroll scrollbar-hidden">
        <div className="flex w-full flex-col align-middle">
          <div className="py-3 text-center font-sora text-h2">
            Select test identity
          </div>
          <div className="text-center text-b1 text-gray-500">
            Choose one of the identities below to start testing with.
          </div>
        </div>
        <DynamicList />
        <button
          className="absolute bottom-8 right-8  m-auto flex h-12 w-12 items-center justify-center rounded-full bg-black"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={async () => {
            void generateNextIdentity();
          }}
        >
          <Icon
            name="plus"
            className="m-auto h-5  w-5 text-white"
          />
        </button>
      </div>
    </div>
  );
}
