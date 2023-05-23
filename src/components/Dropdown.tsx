import type { Chain } from "@/types";
import { Content, Item, Root, Trigger } from "@radix-ui/react-dropdown-menu";
import type { Dispatch, SetStateAction } from "react";
import { memo, useMemo, useState } from "react";

interface OptionType {
  src: string;
  alt: string;
  label: string;
  chain: Chain;
}

interface DropdownProps {
  options: OptionType[];
  setChain: Dispatch<SetStateAction<Chain>>;
}

export const Dropdown = memo(function Dropdown(props: DropdownProps) {
  const [selected, setSelected] = useState<OptionType | null>(null);

  const filteredOptions = useMemo(
    () => props.options.filter((option) => option.chain !== selected?.chain),
    [props.options, selected],
  );

  const handleSelect = (option: OptionType) => {
    setSelected(option);
    props.setChain(option.chain);
  };

  return (
    <Root>
      <Trigger className="flex items-center rounded-12 border p-3 text-16">
        <div className="flex w-full items-center justify-between">
          {selected ? (
            <div className="flex items-center">
              <img
                src={selected.src}
                alt={selected.alt}
                className="h-8 w-8"
              />
              <span className="ml-3">{selected.label}</span>
            </div>
          ) : (
            <span>Select Chain</span>
          )}
          <img
            src="/icons/direction-down.svg"
            alt="direction-down"
            className="h-8 w-6"
          />
        </div>
      </Trigger>
      <Content className="z-10 flex w-full flex-col gap-y-2 rounded-12 border bg-gray-0 p-4 text-16">
        {filteredOptions.map((option) => (
          <Item
            key={option.label}
            onSelect={() => handleSelect(option)}
            className="flex w-[285px] cursor-pointer items-center outline-none"
          >
            <img
              src={option.src}
              alt={option.alt}
              className="h-8 w-8"
            />
            <span className="ml-3">{option.label}</span>
          </Item>
        ))}
      </Content>
    </Root>
  );
});
