import { Indicator, Root } from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { memo } from "react";
import { Icon } from "./Icon";

interface CheckboxProps {
  checked: boolean | "indeterminate";
  setChecked: (checked: boolean | "indeterminate") => void;
  defaultChecked?: boolean;
}

export const Checkbox = memo(function Checkbox(props: CheckboxProps) {
  return (
    <Root
      checked={props.checked}
      onCheckedChange={props.setChecked}
      className={clsx(
        "h-5 w-5 rounded-5",
        { "bg-00c313": props.checked },
        { "bg-gray-0": !props.checked },
      )}
      defaultChecked
    >
      <Indicator className="flex items-center justify-center">
        <Icon
          name="check"
          className="h-4 w-4 text-gray-0"
        />
      </Indicator>
    </Root>
  );
});
