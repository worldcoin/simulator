import useIdentity from "@/hooks/useIdentity";
import { useIdentityStore } from "@/stores/identityStore";
import {
  CONNECT_URL_QUERY_KEY,
  isValidConnectUrl,
  readSingleQueryValue,
} from "@/lib/connect-url";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function Home() {
  const router = useRouter();
  const { activeIdentityID, identities, generateFirstFiveIdentities } =
    useIdentity();
  const handledConnectUrlRef = useRef<string | null>(null);
  const connectUrl = readSingleQueryValue(router.query[CONNECT_URL_QUERY_KEY]);

  // Seed the first identities only once the persisted store has been read, and
  // decide from the live store state rather than the hook's `identities`: on a
  // full page load React renders with the store's pre-hydration snapshot first,
  // so `identities` can still be empty here although persisted ones exist.
  useEffect(() => {
    const seedIfEmpty = () => {
      if (useIdentityStore.getState().identities.length > 0) return;
      console.log("Generating first five identities...");
      void generateFirstFiveIdentities();
    };

    if (useIdentityStore.persist.hasHydrated()) {
      seedIfEmpty();
      return;
    }
    return useIdentityStore.persist.onFinishHydration(seedIfEmpty);
  }, [generateFirstFiveIdentities]);

  useEffect(() => {
    if (!router.isReady || connectUrl) return;

    if (
      activeIdentityID != null &&
      !router.pathname.includes(`/id/${activeIdentityID}`)
    ) {
      console.log("Redirecting to active identity:", activeIdentityID);
      void router.push(`/id/${activeIdentityID}`);
    } else if (!activeIdentityID && !router.pathname.includes("/select-id")) {
      console.log("Redirecting to select identity");
      void router.push("/select-id");
    }
  }, [activeIdentityID, connectUrl, router]);

  useEffect(() => {
    if (!router.isReady) return;

    if (!connectUrl) {
      handledConnectUrlRef.current = null;
      return;
    }

    const connectUrlValue = connectUrl;

    if (handledConnectUrlRef.current === connectUrlValue) return;

    async function routeFromConnectUrl() {
      const valid = await isValidConnectUrl(connectUrlValue);

      if (!valid) {
        handledConnectUrlRef.current = connectUrlValue;
        toast.error("Invalid connection URL");
        await router.replace("/", undefined, { shallow: true });
        return;
      }

      const selectedId = activeIdentityID ?? identities[0]?.id;

      if (!selectedId) return;

      handledConnectUrlRef.current = connectUrlValue;
      await router.replace(
        {
          pathname: `/id/${selectedId}`,
          query: { [CONNECT_URL_QUERY_KEY]: connectUrlValue },
        },
        undefined,
        { shallow: true },
      );
    }

    void routeFromConnectUrl();
  }, [activeIdentityID, connectUrl, identities, router]);

  return (
    <>
      <div></div>
    </>
  );
}
