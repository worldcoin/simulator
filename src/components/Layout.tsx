import blurSvg from "@public/bg-blur.svg";
import Image from "next/image";
import { ReactNode } from "react";
import { Icon } from "./Icon";
import logoSvg from "@public/logo.svg";

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="fixed grid h-full w-full overflow-y-scroll bg-background sm:min-h-screen">
      <div className="group pointer-events-none overflow-hidden bg-[#f0edf9] fixed h-screen w-full">
        <Image
          src={blurSvg}
          alt=""
          className="fixed h-full w-full object-cover"
        />
      </div>
      <div className="z-10 col-start-1 row-start-1 w-full max-w-[290px] content-start gap-y-8 pl-8 pt-8 lg:grid hidden">
        <Icon data={logoSvg} className="h-10 w-10" />
        <p className="w-full text-777e90">
          This is a simulator of the{" "}
          <a
            href="https://worldcoin.org/download"
            target="_blank"
            className="text-4940e0"
            rel="noreferrer"
          >
            Worldcoin app
          </a>{" "}
          intended for testing World ID.
        </p>
        <div>
          <a
            href="https://id.worldcoin.org/test"
            target="_blank"
            className="text-4940e0"
            rel="noreferrer"
          >
            Read the docs
          </a>
          .
        </div>
      </div>
      <div className="p-4 pb-8 h-[812px] w-[375px] sm:overflow-hidden sm:rounded-[40px] sm:border-4 sm:border-[#183c4a] relative col-start-1 row-start-1 grid grid-rows-auto/1fr self-center justify-self-center gap-y-3 bg-white transition duration-500 dark:bg-[#0c0e10] sm:[zoom:.9] md:[zoom:initial] sm:grid-rows-auto/1fr/auto">
        {children}
      </div>
    </div>
  );
};
