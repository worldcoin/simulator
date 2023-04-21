import Button from "@/components/Button";
import Image from "next/image";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/identity");
  };

  return (
    <div className="flex flex-col justify-between">
      <h1 className="text-center text-2xl font-bold">World ID Simulator</h1>
      <div className="flex justify-end">
        <Button
          type="button"
          className="rounded-[12px] py-4 transition-all w-full bg-[#4940e0] text-16 font-semibold text-white"
          onClick={handleClick}
        >
          Generate Identity
        </Button>
      </div>
    </div>
  );
}
