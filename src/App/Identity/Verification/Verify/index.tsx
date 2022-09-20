import Button from "@/common/Button/Button";
import { GradientButton } from "@/common/GradientButton/GradientButton";
import { validateImageUrl } from "@/common/helpers";
import { Icon } from "@/common/Icon";
import type { ApprovalRequestMetadata } from "@/types/metadata";
import checkBadgeSvg from "@static/check-badge.svg";
import cn from "classnames";
import React from "react";
import "./mask.css";

export const Verify = React.memo(function Verify(props: {
  meta?: Partial<ApprovalRequestMetadata>;
  onDismiss: () => void;
  onVerify: () => void;
}) {
  const [projectLogo, setProjectLogo] = React.useState<string>();

  React.useEffect(() => {
    if (!props.meta?.logo_image || !validateImageUrl(props.meta.logo_image)) {
      return;
    }

    setProjectLogo(props.meta.logo_image);
  }, [props.meta?.logo_image]);

  const onImageLoadError = React.useCallback(() => {
    setProjectLogo(undefined);
  }, []);

  return (
    <div className="grid items-center gap-11 text-center">
      <div className="grid items-center gap-4">
        <div className="relative grid justify-center">
          <div
            className={cn(
              "mask relative grid h-25 w-25 place-content-center bg-gradient-to-r",
              {
                "bg-191c20": projectLogo,
                "from-[#fff0ed] to-[#edecfc]": !projectLogo,
              },
            )}
          >
            {projectLogo && (
              <img
                src={projectLogo}
                className="absolute inset-4 object-contain"
                alt={props.meta?.project_name ?? "A Project"}
                onError={onImageLoadError}
              />
            )}
            {!projectLogo && (
              <span className="bg-gradient-to-r from-[#ff6848] to-4940e0 bg-clip-text font-sora text-30 font-semibold text-transparent">
                ?
              </span>
            )}
            <span className="mask-border absolute inset-0 bg-[#3c4040]"></span>
          </div>
          <span className="absolute left-1/2 bottom-0 -translate-x-1/2">
            {props.meta?.validated && (
              <span className="flex gap-1 rounded-8 border px-2 py-1">
                <Icon
                  data={checkBadgeSvg}
                  className="h-4 w-4"
                  noMask
                />
                Verified
              </span>
            )}
            {!props.meta?.validated && (
              <span className="mask grid h-5 w-5 place-content-center bg-ffffff text-12 text-[#858494] [mask-size:_contain]">
                ?
              </span>
            )}
          </span>
        </div>

        <div className="text-26 text-858494">
          <span className="text-ffffff">
            {props.meta?.project_name ?? "A Project"}
          </span>{" "}
          wants to verify that you haven’t done this before
        </div>
      </div>

      <div className="bg-gradient-to-r from-transparent via-858494 to-transparent py-[1px] font-medium text-dde7ea">
        <span className="relative block bg-[#0c0e10] py-5">
          {props.meta?.description ?? "No description provided"}
        </span>
      </div>

      <div className="grid gap-6">
        <GradientButton
          isVisible
          withShadow
          onClick={props.onVerify}
          bgColor="#191c20"
          className="font-sora text-16 font-semibold uppercase"
          textClassName="block p-5"
        >
          Verify with World ID
        </GradientButton>

        <Button
          className="text-18 font-medium text-d1d3d4"
          onClick={props.onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
});
