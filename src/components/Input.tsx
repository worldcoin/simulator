import { cn } from "@/lib/utils";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  renderButton?: (props: {
    isEmpty: boolean;
    isFocused: boolean;
    isInvalid: boolean;
  }) => React.ReactNode;
}

/** World App text field: 56pt, secondary fill at rest, hairline stroke when focused. */
export const Input = React.memo(function Input(props: InputProps) {
  const {
    className,
    value,
    onChange,
    invalid: isInvalid = false,
    renderButton,
    ...otherProps
  } = props;

  const [isEmpty, setIsEmpty] = React.useState<boolean>(true);

  // This useEffect is required to set the correct state of the input field when the value is changed from outside
  React.useEffect(() => {
    if (value === undefined || value === "") {
      setIsEmpty(true);
    }
  }, [value]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsEmpty(e.target.value === "");
      if (onChange) {
        onChange(e);
      }
    },
    [onChange],
  );

  const [isFocused, setIsFocused] = React.useState<boolean>(false);

  const handleFocus = React.useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = React.useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <div
      className={cn(
        className,
        "flex h-14 items-center gap-2 rounded-12 border pl-4 pr-2 transition-colors",
        {
          "border-transparent bg-surface-secondary": !isFocused && !isInvalid,
          "border-stroke-secondary bg-surface-primary": isFocused && !isInvalid,
          "border-status-error bg-surface-primary": isInvalid,
        },
      )}
    >
      <input
        className="h-full min-w-0 grow bg-transparent text-s1 text-fg-primary outline-0 placeholder:text-fg-tertiary"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-invalid={isInvalid || undefined}
        {...otherProps}
      />

      {renderButton?.({ isEmpty, isFocused, isInvalid })}
    </div>
  );
});
