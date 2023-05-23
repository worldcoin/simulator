import { GradientIcon } from "@/components/GradientIcon";
import type { IconType } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import { Indicator, Item } from "@radix-ui/react-radio-group";

export interface CredentialProps {
  icon: IconType;
  text: string;
  value: string;
  color: string;
  single?: boolean;
  className?: string;
}

export function Credential(props: CredentialProps) {
  return (
    <Item
      value={props.value}
      asChild
    >
      <div className="grid grid-cols-auto/1fr/auto items-center gap-x-4 rounded-16 bg-gray-100 p-3.5">
        <div>
          <GradientIcon
            className="h-8 w-8"
            color={props.color}
            name={props.icon}
          />
        </div>

        <div className="text-s2">{props.text}</div>

        {props.single && (
          <Icon
            name="check"
            className="h-6 w-6 text-00c313"
          />
        )}
        {!props.single && (
          <div className="flex h-5 w-5 items-center justify-center rounded-5 bg-ffffff">
            <Indicator asChild>
              <div className="flex h-5 w-5 items-center justify-center rounded-5 bg-00c313">
                <Icon
                  name="check"
                  className="h-4 w-4 text-ffffff"
                />
              </div>
            </Indicator>
          </div>
        )}
      </div>
    </Item>
  );
}
