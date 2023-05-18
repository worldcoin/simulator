import { Icon } from "@/components/Icon";
import clsx from "clsx";

export interface StatusProps {
  className?: string;
  status: "error" | "verified" | "verifying";
}

export function Status(props: StatusProps) {
  return (
    <div
      className={clsx(
        props.className,
        "flex items-center justify-center gap-x-3",
      )}
    >
      {props.status === "verifying" && (
        <Icon
          name="spinner"
          className="h-6 w-6 animate-spin"
        />
      )}

      {props.status === "verified" && (
        <Icon
          name="check-circle"
          className="h-6 w-6 text-00c313"
        />
      )}

      {props.status === "error" && (
        <Icon
          name="close-circle"
          className="h-6 w-6 text-ff5a76"
        />
      )}

      {props.status === "verifying" && (
        <div className="font-sora text-16 font-semibold text-gray-500">
          Verifying
        </div>
      )}

      {props.status === "verified" && (
        <div className="font-sora text-16 font-semibold text-00c313">
          Verifying
        </div>
      )}

      {props.status === "error" && (
        <div className="font-sora text-16 font-semibold text-ff5a76">
          Verification failed
        </div>
      )}
    </div>
  );
}
