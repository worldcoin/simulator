import { GradientIcon } from "../GradientIcon";
import type { IconType } from "../Icon";
import { Icon } from "../Icon";
import Item from "../Item";

interface VerifyItemProps {
  heading: string;
  text?: string;
  icon: IconType;
  color: string;
  className?: string;
  verified?: boolean;
  onClick: (
    event?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => void;
}

export default function VerifyItem(props: VerifyItemProps) {
  return (
    <Item
      heading={props.heading}
      text={props.verified ? "Verified" : props.text}
      className={props.className}
      disabled={props.verified}
      onClick={props.onClick}
    >
      {props.verified ? (
        <GradientIcon
          name={props.icon}
          color={props.color}
          className="h-5 w-5"
        />
      ) : (
        <Icon
          name={props.icon}
          className="h-5 w-5 text-gray-400"
          bgClassName="h-10 w-10 bg-gray-200 rounded-12"
        />
      )}
    </Item>
  );
}
