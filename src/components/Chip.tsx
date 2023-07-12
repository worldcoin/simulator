import useIdentity from "@/hooks/useIdentity";
import { cn, isPendingInclusion } from "@/lib/utils";
import type { CacheStore } from "@/stores/cacheStore";
import { useCacheStore } from "@/stores/cacheStore";
import { useEffect, useMemo } from "react";
import { Icon } from "./Icon";

const getStore = (store: CacheStore) => ({
  complete: store.complete,
});

export default function Chip() {
  const { identity, updateIdentity } = useIdentity();
  const { complete } = useCacheStore(getStore);

  const isPending = useMemo(() => {
    if (!identity) return false;
    return isPendingInclusion(identity);
  }, [identity]);

  const isReady = useMemo(() => {
    return complete && !isPending;
  }, [complete, isPending]);

  // Check on pending inclusion proofs every 30 seconds until mined
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPending) {
        clearInterval(interval);
        return;
      }

      if (!identity) return;
      void updateIdentity(identity);
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

  return (
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
          {identity?.persisted ? "Persistent ID" : "Temporary ID"}
        </span>
      )}
      {!complete && <span className="ml-1">Downloading Semaphore</span>}
      {complete && isPending && <span className="ml-1">Pending Inclusion</span>}
    </div>
  );
}
