import { NavBar, NavBarButton } from "@/components/NavBar";
import useIdentity from "@/hooks/useIdentity";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const DynamicList = dynamic(() => import("@/components/SelectID/IDsList"), {
  ssr: false,
});

export default function Select() {
  const router = useRouter();
  const { activeIdentityID, generateNextIdentity } = useIdentity();

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-2 pb-6 scrollbar-hidden">
      <NavBar
        title="Test identities"
        leading={
          // Nothing to go back to until an identity is active.
          activeIdentityID && (
            <NavBarButton
              icon="xmark"
              label="Close"
              onClick={() => void router.push(`/id/${activeIdentityID}`)}
            />
          )
        }
        trailing={
          <NavBarButton
            icon="plus"
            label="Add identity"
            onClick={() => void generateNextIdentity()}
          />
        }
      />
      <p className="text-b2 text-fg-secondary">
        Pick an identity to test with. Each one holds every credential on the
        World ID staging network.
      </p>
      <DynamicList />
    </div>
  );
}
