import { Checkbox } from "@/components/Checkbox";
import type { DrawerProps } from "@/components/Drawer";
import { Drawer } from "@/components/Drawer";
import { GradientIcon } from "@/components/GradientIcon";
import { Icon } from "@/components/Icon";
import Item from "@/components/Item";
import { VerifyStatus } from "@/components/Verify/VerifyStatus";
import { Status } from "@/types";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";

interface ModalProps {
  name?: string;
  engine?: string;
  is_staging?: boolean;
  is_verified?: boolean;
  logo_url?: string;
  verified_app_logo?: string;
  can_user_verify?: string;
  sign_in_with_world_id?: boolean;
  action?: { description?: string };
  status: Status;
  setStatus: (status: Status) => void;
  open: DrawerProps["open"];
  onClose: DrawerProps["onClose"];
  isLoading: boolean;
}

export function Modal(props: ModalProps) {
  const [biometricsChecked, setBiometricsChecked] = useState<
    boolean | "indeterminate"
  >(true);
  const [phoneChecked, setPhoneChecked] = useState<boolean | "indeterminate">(
    true,
  );

  return (
    <Drawer
      open={props.open}
      onClose={props.onClose}
    >
      {!props.isLoading && (
        <>
          <div className="grid grid-cols-auto/1fr items-center gap-x-4">
            <div className="flex h-15 w-15 items-center justify-center rounded-full border border-gray-200">
              <Image
                src={
                  props.verified_app_logo ??
                  props.logo_url ??
                  "/icons/question.svg"
                }
                alt={props.name ?? "App logo"}
                width={40}
                height={40}
              />
            </div>

            <div className="flex flex-col">
              <span className="text-h3 font-bold">
                {props.name ?? "App Name"}
              </span>
              <div
                className={clsx(
                  "inline-flex items-center gap-x-0.5",
                  { "text-info-700": props.is_verified },
                  { "text-gray-500": !props.is_verified },
                )}
              >
                <Icon
                  name={
                    props.is_verified
                      ? "badge-not-verified" // TODO: Replace with verified badge asset
                      : "badge-not-verified"
                  }
                  className={"h-4 w-4"}
                />
                <span className="text-b4 leading-[1px]">
                  {props.is_verified ? "Verified" : "Not Verified"}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-b2 text-gray-500">
            {props.name ?? "App Name"} is asking for permission to{" "}
            {props.action?.description ?? "verify with World ID."}
          </p>

          <h3 className="mt-8 text-12 font-medium uppercase leading-[1.25] text-gray-500">
            Choose Credentials
          </h3>

          <div className="mt-3 grid gap-y-2">
            <Item
              heading="Biometrics"
              onClick={() => setBiometricsChecked(!biometricsChecked)}
              indicator={() => (
                <Checkbox
                  checked={biometricsChecked}
                  setChecked={setBiometricsChecked}
                />
              )}
            >
              <GradientIcon
                name="user"
                color="#9D50FF"
              />
            </Item>
            <Item
              heading="Phone"
              onClick={() => setPhoneChecked(!phoneChecked)}
              indicator={() => (
                <Checkbox
                  checked={phoneChecked}
                  setChecked={setPhoneChecked}
                />
              )}
            >
              <GradientIcon
                name="phone"
                color="#00C313"
              />
            </Item>
          </div>

          <div className="mt-8">
            <VerifyStatus
              status={props.status}
              setStatus={props.setStatus}
              handleClick={() => props.setStatus(Status.Pending)}
            />
          </div>
        </>
      )}
      {props.isLoading && (
        <div className="flex h-[360px] items-center justify-center">
          <Icon
            name="spinner"
            className="h-8 w-8 animate-spin text-gray-500"
          />
        </div>
      )}
    </Drawer>
  );
}
