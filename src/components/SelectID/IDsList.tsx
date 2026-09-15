import useIdentity from "@/hooks/useIdentity";
import IDRow from "./IDRow";

export default function IDsList() {
  const { identities, activeIdentityID } = useIdentity();

  return (
    <ul className="flex flex-col">
      {[...identities]
        .sort((a, b) => b.meta.idNumber - a.meta.idNumber)
        .map((identity, index, all) => (
          <IDRow
            key={identity.id}
            identity={identity}
            active={identity.id === activeIdentityID}
            divider={index < all.length - 1}
          />
        ))}
    </ul>
  );
}
