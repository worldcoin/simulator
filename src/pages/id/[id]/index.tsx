import { useRouter } from "next/router";

export default function Id() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="grid content-between px-2 pb-6 xs:pb-0">
      <p className="text-000000">hello {id}</p>
    </div>
  );
}
