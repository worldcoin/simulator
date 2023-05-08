import { Icon } from "@/components/Icon";
import clsx from "clsx";
import Image from "next/image";
import bgBlur from "/public/images/bg-blur.svg";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed grid h-full w-full overflow-y-scroll bg-f9fbfc xs:min-h-screen">
      <div className="group pointer-events-none fixed h-screen w-full overflow-hidden bg-f0edf9">
        <Image
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          src={bgBlur}
          alt="blur"
          className="fixed h-full w-full object-cover"
        />
      </div>
      <div className="z-10 col-start-1 row-start-1 hidden w-full max-w-[290px] content-start gap-y-8 pl-8 pt-8 lg:grid">
        <Icon
          name="logo"
          className="h-10 w-10"
        />
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
            href="https://docs.worldcoin.org/"
            target="_blank"
            className="text-4940e0"
            rel="noreferrer"
          >
            Read the docs
          </a>
          .
        </div>
      </div>
      <section
        className={clsx(
          "h-full w-full p-4 pb-8 xs:h-[812px] xs:w-[375px] xs:overflow-hidden xs:rounded-40 xs:border-4 xs:border-183c4a",
          "relative col-start-1 row-start-1 grid grid-rows-auto/1fr self-center justify-self-center",
          "gap-y-3 bg-ffffff transition duration-500 xs:grid-rows-auto/1fr/auto xs:[zoom:.9] md:[zoom:initial]",
        )}
      >
        {children}
        <hr className="absolute bottom-2 left-1/2 hidden h-[5px] w-32 -translate-x-1/2 rounded-full bg-000000 xs:block" />
      </section>
    </div>
  );
}
