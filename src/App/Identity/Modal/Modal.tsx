import cn from "classnames";
import React from "react";

const Modal = React.memo(function Modal(props: {
  isVisible: boolean;
  children: React.ReactNode;
}) {
  return (
    <React.Fragment>
      <div
        className={cn(
          "absolute inset-0 z-40 bg-191c20/60 transition-all xs:rounded-34",
          { "pointer-events-none invisible opacity-0": !props.isVisible },
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 z-50 grid h-[75%] w-full grid-rows-auto/1fr gap-y-4 rounded-t-30 bg-ffffff py-4 px-8 transition-all xs:rounded-b-34",
          { "pointer-events-none invisible h-0 opacity-0": !props.isVisible },
        )}
      >
        <hr className="mx-auto h-[5px] w-[74px] self-start rounded-full border-none bg-d1d3d4" />

        {props.children}
      </div>
    </React.Fragment>
  );
});

export default Modal;
