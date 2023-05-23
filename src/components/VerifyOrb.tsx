import Header from "@/components/Header";
import useIdentity from "@/hooks/useIdentity";
import { CredentialType, Status } from "@/types";
import Image from "next/image";
import { useRouter } from "next/router";
import { memo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Drawer } from "./Drawer";
import { VerifyStatus } from "./VerifyStatus";

export const VerifyOrb = memo(function VerifyOrb(props: {
  open: boolean;
  onClose: () => void;
  handleVerify: (credentialType: CredentialType) => Promise<void>;
}) {
  const router = useRouter();
  const { identity } = useIdentity();

  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>(Status.Waiting);

  const handleClick = async () => {
    setStatus(Status.Pending);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await props.handleVerify(CredentialType.Orb);
      setStatus(Status.Verified);
      if (identity) {
        // Display verified state for 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
        void router.push(`/id/${identity.id}`);
      }
    } catch (error) {
      setStatus(Status.Error);
      toast.error(error.message);

      // Reset status after 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));
      setStatus(Status.Waiting);
    }
  };

  return (
    <Drawer
      fullHeight
      open={props.open}
      onClose={props.onClose}
    >
      <div className="flex h-full flex-col">
        <Header
          iconLeft="direction-down"
          onClickLeft={props.onClose}
        />
        <div className="relative mt-10 flex items-center justify-center">
          <div className="absolute z-10 h-72 w-72 rounded-full border-[8px] border-gray-100" />
          <Image
            src="/images/orb.png"
            alt="The Worldcoin Orb"
            width={341}
            height={243}
          />
        </div>

        <h1 className="mt-24 text-center font-sora text-h1">
          Verify your identity
        </h1>
        <p className="mt-4 text-center text-b2 text-gray-500">
          Verifying your identity is the equivalent of going to a Worldcoin Orb
          and verifying you are a unique human.
        </p>

        <div className="grow" />
        <VerifyStatus
          status={status}
          setStatus={setStatus}
          handleClick={handleClick}
        />
      </div>
    </Drawer>
  );
});
