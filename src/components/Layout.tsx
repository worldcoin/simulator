import blurSvg from "@public/bg-blur.svg";
import { clsx } from "clsx";
import Image from "next/image";
import { ReactNode } from "react";

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="fixed grid h-full w-full overflow-y-scroll bg-background xs:min-h-screen">
      <div
        className={clsx(
          "group pointer-events-none overflow-hidden bg-f0edf9 fixed h-screen w-full"
        )}
      >
        <Image
          src={blurSvg}
          alt=""
          className="fixed h-full w-full object-cover"
        />
      </div>
      <div className="z-10 col-start-1 row-start-1 w-full max-w-[290px] content-start gap-y-8 pl-8 pt-8 lg:grid">
        {children}
      </div>
    </div>
  );
};
