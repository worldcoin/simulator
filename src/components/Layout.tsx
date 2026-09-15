import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid size-full overflow-hidden bg-surface-secondary">
      <div className="pointer-events-none fixed h-screen w-full bg-[radial-gradient(60%_50%_at_50%_30%,#FFFFFF_0%,#F7F7F7_100%)]" />

      <aside className="z-10 col-start-1 row-start-1 hidden w-full max-w-[300px] content-start gap-y-6 pl-8 pt-8 lg:grid">
        <Icon
          name="worldcoin"
          className="size-10 text-fg-primary"
          label="World"
        />
        <div className="flex flex-col gap-y-2">
          <p className="text-h5 text-fg-primary">World ID Simulator</p>
          <p className="text-b2 text-fg-secondary">
            A stand-in for the{" "}
            <a
              href="https://world.org/download"
              target="_blank"
              className="text-fg-primary underline underline-offset-2"
              rel="noreferrer"
            >
              World App
            </a>{" "}
            so you can test World ID verifications on the staging network
            without a phone.
          </p>
        </div>
        <a
          href="https://docs.world.org/"
          target="_blank"
          className="text-s2 text-fg-primary underline underline-offset-2"
          rel="noreferrer"
        >
          Read the docs
        </a>
      </aside>

      <section
        className={cn(
          "h-full w-full px-4 xs:h-[812px] xs:w-[375px] xs:overflow-hidden xs:rounded-40 xs:border-4 xs:border-grey-950 xs:p-4",
          "relative col-start-1 row-start-1 grid grid-rows-auto/1fr self-center justify-self-center",
          "gap-y-3 bg-surface-primary transition duration-500 xs:grid-rows-auto/1fr/auto xs:[zoom:.9] [@media(max-height:820px)]:[zoom:.74] [@media(max-height:900px)]:[zoom:.82]",
        )}
      >
        {children}
        <hr className="absolute bottom-2 left-1/2 hidden h-[5px] w-32 -translate-x-1/2 rounded-full border-0 bg-grey-950 xs:block" />
      </section>
    </div>
  );
}
