import Button from "./Button";
import type { IconType } from "./Icon";
import { Icon } from "./Icon";

export default function Header(props: {
  heading?: string;
  iconLeft?: IconType;
  iconRight?: IconType;
  onClickLeft?: (
    event?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => void;
  onClickRight?: (
    event?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-3 grid w-full grid-cols-3 items-center justify-between">
      {props.iconLeft && props.onClickLeft && (
        <Button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ebecef"
          onClick={props.onClickLeft}
        >
          <Icon
            name={props.iconLeft}
            className="h-6 w-6"
          />
        </Button>
      )}
      {!props.iconLeft && <span />}
      {props.heading && (
        <h2 className="text-center font-rubik text-20 font-semibold text-191c20">
          {props.heading}
        </h2>
      )}
      {!props.heading && props.children}
      {props.iconRight && props.onClickRight && (
        <Button
          className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full bg-ebecef"
          onClick={props.onClickRight}
        >
          <Icon
            name={props.iconRight}
            className="h-6 w-6"
          />
        </Button>
      )}
      {!props.iconRight && <span />}
    </div>
  );
}
