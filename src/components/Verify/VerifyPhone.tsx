import Header from "@/components/Header";
import useIdentity from "@/hooks/useIdentity";
import { Status } from "@/types";
import { CredentialType } from "@worldcoin/idkit-core";
import { useRouter } from "next/router";
import { memo, useState } from "react";
import toast from "react-hot-toast";
import { Drawer } from "../Drawer";
import { IconGradient } from "../Icon/IconGradient";
import { Input } from "../Input";
import { VerifyStatus } from "./VerifyStatus";

export const VerifyPhone = memo(function VerifyPhone(props: {
  open: boolean;
  onClose: () => void;
  handleVerify: (credentialType: CredentialType) => Promise<void>;
}) {
  const router = useRouter();
  const { activeIdentity } = useIdentity();

  const [status, setStatus] = useState<Status>(Status.Waiting);

  const handleClick = async () => {
    setStatus(Status.Pending);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await props.handleVerify(CredentialType.Device);
      setStatus(Status.Success);
      if (activeIdentity) {
        // Display verified state for 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
        void router.push(`/id/${activeIdentity.id}`);
      }
    } catch (error) {
      setStatus(Status.Error);
      toast.error((error as Error).message);

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
        <IconGradient
          name="phone"
          color="#00C313"
          className="h-10 w-10 text-white"
          bgClassName="h-20 w-20 mx-auto mt-5"
        />

        <h1 className="mt-8 text-center font-sora text-h1">
          Phone number verification
        </h1>
        <p className="mt-4 text-center text-b2 text-gray-500">
          Verifying your phone number is the equivalent of adding your number in
          the World app.
        </p>

        <Input
          value="+1 555 867 5309"
          className="mt-8"
          disabled
        />
        <p className="mx-2 mt-1 text-left text-b3 text-gray-400">
          Phone number is randomly simulated and unverified
        </p>

        <div className="grow" />
        <VerifyStatus
          status={status}
          handleClick={() => void handleClick()}
        />
      </div>
    </Drawer>
  );
});
