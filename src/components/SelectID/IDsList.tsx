import useIdentity from "@/hooks/useIdentity";
import IDRow from "./IDRow";

export default function IDsList() {
  const { identities } = useIdentity();

  return (
    <div className="mt-12 flex h-full max-h-[calc(100vh-100rem)] w-full flex-col gap-4 ">
      {identities
        .sort((a, b) => b.meta.idNumber - a.meta.idNumber)
        .map((identity, i) => {
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
