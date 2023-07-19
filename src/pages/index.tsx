import useIdentity from "@/hooks/useIdentity";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { activeIdentityID, identities, generateFirstFiveIdentities } =
    useIdentity();

  useEffect(() => {
    if (identities.length === 0) {
      console.log("Generating first five identities...");
      void generateFirstFiveIdentities();
    }
  }, [generateFirstFiveIdentities, identities]);

  useEffect(() => {
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
  }, [activeIdentityID, router]);

  return (
    <>
      <div></div>
    </>
  );
}
