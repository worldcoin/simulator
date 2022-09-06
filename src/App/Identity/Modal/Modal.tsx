import cn from "classnames";
import React from "react";

const Modal = React.memo(function Modal(props: {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <React.Fragment>
      <div
        onClick={(e) =>
          e.currentTarget === e.target && props.setIsVisible(false)
        }
        aria-hidden="true"
        className={cn(
          "absolute inset-0 z-40 bg-191c20/60 transition-all xs:rounded-34",
          { "pointer-events-none invisible opacity-0": !props.isVisible },
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 z-50 grid h-[75%] w-full grid-rows-auto/1fr gap-y-8 rounded-t-30 bg-ffffff pt-2 pb-8 transition-all xs:rounded-b-34",
          { "pointer-events-none invisible h-0 opacity-0": !props.isVisible },
          props.className,
        )}
      >
        <hr className="mx-auto h-[5px] w-8 self-start rounded-full border-none bg-d1d3d4" />

        {props.children}
      </div>
    </React.Fragment>
  );
});

export default Modal;
