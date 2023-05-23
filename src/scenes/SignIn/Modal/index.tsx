import Button from "@/components/Button";
import type { DrawerProps } from "@/components/Drawer";
import { Drawer } from "@/components/Drawer";
import { Icon } from "@/components/Icon";
import { RadioGroup } from "@radix-ui/react-radio-group";
import Image from "next/image";
import { Credential } from "./Credential";
import { Status } from "./Status";

export interface ModalProps {
  title: string;
  status?: "error" | "verified" | "verifying";
  imageUrl?: string;
  open: DrawerProps["open"];
  onClose: DrawerProps["onClose"];
}

export function Modal(props: ModalProps) {
  return (
    <Drawer
      closeClassName="!right-[24px] !left-auto"
      closeIcon="close"
      open={props.open}
      onClose={props.onClose}
    >
      <div className="grid grid-cols-auto/1fr items-center gap-x-4">
        <div className="flex h-15 w-15 items-center justify-center rounded-full border border-gray-200">
          {props.imageUrl && (
            <Image
              width={40}
              height={40}
              src={props.imageUrl}
              alt={props.title}
            />
          )}
        </div>

        <div className="flex flex-col">
          <div className="text-h3 font-bold">{props.title}</div>

          <div className="inline-flex items-center gap-x-0.5">
            <Icon
              name="badge-not-verified"
              className="h-4 w-4 text-gray-500"
            />

            <div className="text-b4 leading-[1px] text-gray-500">
              Not Verified
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-b2 text-gray-500">
        GitLab Fox is asking for permission to sign up-with World ID.
      </div>

      <div className="mt-8 text-12 font-medium uppercase leading-[1.25] text-gray-500">
        Choose Credentials
      </div>

      <RadioGroup
        defaultValue="biometrics"
        asChild
      >
        <div className="mt-3 grid gap-y-2">
          <Credential
            color="#9D50FF"
            icon="user"
            text="Biometrics"
            value="biometrics"
          />

          <Credential
            color="#00C313"
            icon="phone"
            text="Phone"
            value="phone"
          />
        </div>
      </RadioGroup>

      <div className="mt-8 pb-6">
        {!props.status && (
          <Button
            className="flex h-14 w-full items-center justify-center gap-x-3 bg-gray-900 font-sora text-16 font-semibold text-ffffff"
            onClick={() => null}
          >
            <Icon
              name="world-id"
              className="h-6 w-6"
            />
            Sign in with World ID
          </Button>
        )}

        {props.status && <Status status={props.status} />}
      </div>
    </Drawer>
  );
}
