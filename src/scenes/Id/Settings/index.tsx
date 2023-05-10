import React from "react";
import { Icon } from "@/components/Icon";
import { CardIcon } from "@/components/CardIcon";
import { Drawer } from "@/components/Drawer";

export const Settings = React.memo(function Settings(props: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={props.open}
      onClose={props.onClose}
    >
      <div className="py-1.5 text-center text-h3 font-bold">Settings</div>

      <div className="mt-6 grid gap-y-3">
        <button className="grid grid-cols-auto/1fr/auto items-center gap-x-3 rounded-12 bg-gray-50 p-4">
          <CardIcon
            className="h-8 w-8"
            name="user"
            color="#9D50FF"
          />

          <div className="grid gap-y-0.5 text-left">
            <div className="text-s3">Credentials</div>
            <div className="text-b4 text-gray-500">Manage your credentials</div>
          </div>

          <Icon
            name="direction-right"
            className="h-6 w-6 text-gray-400"
          />
        </button>

        <button className="grid grid-cols-auto/1fr/auto items-center gap-x-3 rounded-12 bg-gray-50 p-4">
          <CardIcon
            className="h-8 w-8"
            name="file"
            color="#00C3B6"
          />

          <div className="grid gap-y-0.5 text-left">
            <div className="text-s3">Identity commitment</div>
            <div className="text-b4 text-gray-500">
              Copy your ID commitment number
            </div>
          </div>

          <Icon
            name="copy"
            className="h-6 w-6 text-gray-400"
          />
        </button>
      </div>
    </Drawer>
  );
});
