import useIdentity from "@/hooks/useIdentity";
import { cn } from "@/lib/utils";
import type { CacheStore } from "@/stores/cacheStore";
import { useCacheStore } from "@/stores/cacheStore";
import { useMemo } from "react";
import { Icon } from "./Icon";

const getStore = (store: CacheStore) => ({
  complete: store.complete,
});

export default function Chip() {
  useIdentity();
  const { complete } = useCacheStore(getStore);

  const isReady = useMemo(() => {
    return complete;
  }, [complete]);

  return !isReady ? (
    <div
      className={cn(
        complete
          ? "bg-info-100 text-info-700"
          : "bg-warning-100 text-warning-700",
        "flex h-8 items-center gap-1 rounded-full px-3 text-s4 font-medium",
      )}
    >
      {isReady ? (
        <Icon
          name="user"
          className="h-4 w-4"
        />
      ) : (
        <Icon
          name="spinner"
          className="h-4 w-4 animate-spin"
        />
      )}

      {isReady && (
        <span className="leading-[1px]">
          {/* {activeIdentity?.persisted ? "Persistent ID" : "Temporary ID"} */}
          {/* {true ? "Persistent ID" : "Temporary ID"} */}
        </span>
      )}
      {!complete && <span className="ml-1">Downloading Semaphore</span>}
    </div>
  ) : (
    <div></div>
  );
}
