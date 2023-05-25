import { Modal } from "@/components/Modal";
import { fetchMetadata } from "@/services/metadata";
import type { MetadataRequest, MetadataResponse } from "@/types";
import { Status } from "@/types";
import React, { useEffect } from "react";
import { toast } from "react-toastify";

export default function SignIn() {
  const [open, setOpen] = React.useState(true);
  const [status, setStatus] = React.useState(Status.Waiting);
  const [metadata, setMetadata] = React.useState<Partial<MetadataResponse>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  // DEBUG
  const testApp = {
    app_id: "app_40fb1f035db244646bf141109ac51042",
    action: "test_action_mobile_app",
    nullifier_hash:
      "0x21633f8bdce21e0ab2f02be6f4e7e73bf6b4a1c0ff91aae797d382f4f14d43d1",
    external_nullifier:
      "0x00065ec0336d4fdb13caa09894b08883cef7318d1f8ce56f59d11437bf818185",
  } as MetadataRequest;

  // DEBUG
  useEffect(() => {
    async function getMetadata() {
      try {
        const response = await fetchMetadata(testApp);
        setMetadata(response);
      } catch (error) {
        toast.error("Unable to fetch app metadata!");
      }
      setIsLoading(false);
    }

    void getMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Modal
        {...metadata}
        status={status}
        setStatus={setStatus}
        open={open}
        onClose={() => setOpen(false)}
        isLoading={isLoading}
      />
    </div>
  );
}
