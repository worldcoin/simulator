import Header from "@/components/Header";
import useIdentity from "@/hooks/useIdentity";
import { CredentialType, Status } from "@/types";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/router";
import { memo, useState } from "react";
import { toast } from "react-toastify";
import { Drawer } from "../Drawer";
import { VerifyStatus } from "./VerifyStatus";

export const VerifyOrb = memo(function VerifyOrb(props: {
  open: boolean;
  onClose: () => void;
  handleVerify: (credentialType: CredentialType) => Promise<void>;
}) {
  const router = useRouter();
  const { identity } = useIdentity();

  const [status, setStatus] = useState<Status>(Status.Waiting);

  const handleClick = async () => {
    setStatus(Status.Pending);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await props.handleVerify(CredentialType.Orb);
      setStatus(Status.Success);
      if (identity) {
        // Display verified state for 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
        void router.push(`/id/${identity.id}`);
      }
    } catch (error) {
      setStatus(Status.Error);
      toast.error((error as Error).message);

      // Reset status after 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));
      setStatus(Status.Waiting);
    }
  };

  const pathVariant = {
    hidden: { pathLength: 0 },
    visible: {
      pathLength: 1,
      transition: { ease: "easeInOut", duration: 1 },
    },
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
          <motion.svg
            width="288"
            height="288"
            viewBox="0 0 288 288"
            initial="hidden"
            animate="visible"
            className="absolute z-10"
          >
            <circle
              cx="144"
              cy="144"
              r="140"
              fill="none"
              stroke="#F3F4F5"
              strokeWidth="8"
            />
            {status === Status.Success && (
              <>
                <motion.path
                  d="M144,4 a140,140 0 0,1 0,280"
                  fill="none"
                  stroke="#00C313"
                  strokeWidth="8"
                  strokeLinecap="round"
                  variants={pathVariant}
                  initial="hidden"
                  animate="visible"
                />
                <motion.path
                  d="M144,4 a140,140 0 0,0 0,280"
                  fill="none"
                  stroke="#00C313"
                  strokeWidth="8"
                  strokeLinecap="round"
                  variants={pathVariant}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                />
              </>
            )}
          </motion.svg>
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
          handleClick={handleClick}
        />
      </div>
    </Drawer>
  );
});
