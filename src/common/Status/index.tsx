import cn from "classnames";
import React from "react";

const Status = React.memo(function Status(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid h-[100px] w-[100px] items-center justify-center rounded-full bg-f1f5f8 dark:bg-191c20",
        props.className,
      )}
    >
      <div
        className={cn(
          "relative grid h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-f66751 to-5743d6",
          "before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:bg-000000",
        )}
      >
        {props.children}
      </div>
    </div>
  );
});

export default Status;
