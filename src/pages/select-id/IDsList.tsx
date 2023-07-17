import useIdentity from "@/hooks/useIdentity";
import IDRow from "./IDRow";

export default function IDsList() {
  const { identities } = useIdentity();

  return (
    <div className="mt-12 flex h-full w-full flex-col gap-4 pb-40">
      {identities.map((identity, i) => {
        return (
          <IDRow
            key={i}
            identity={identity}
          />
        );
      })}
    </div>
  );
}
