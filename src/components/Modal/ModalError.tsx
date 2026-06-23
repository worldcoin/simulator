import { ErrorsCode } from "@/types";
import type { ReactNode } from "react";
import { Icon, type IconType } from "../Icon";

const DEVELOPER_PORTAL_URL = "https://developer.world.org";

type Content = {
  iconName: IconType;
  iconClassName: string;
  iconBgClassName: string;
  noMask?: boolean;
  title: string;
  centerTitle?: boolean;
  body: ReactNode;
  padded?: boolean;
  link?: boolean;
};

const warningIcon = {
  iconName: "warning",
  iconClassName: "size-10 text-white",
  iconBgClassName: "h-16 w-16 rounded-full bg-error-700",
} satisfies Pick<Content, "iconBgClassName" | "iconClassName" | "iconName">;

const errorContent: Partial<Record<ErrorsCode, Content>> = {
  [ErrorsCode.InputError]: {
    iconName: "qr-code",
    iconClassName: "size-10",
    iconBgClassName: "h-20 w-20 rounded-full bg-gray-400",
    noMask: true,
    title: "Expired QR Code",
    body: (
      <>
        This connection has expired <br /> Please try a different code.
      </>
    ),
  },
  [ErrorsCode.MissingAction]: {
    ...warningIcon,
    title: "Action Required",
    centerTitle: true,
    padded: true,
    body: (
      <>
        No action found for this app.
        <br />
        Create one in the Developer Portal.
      </>
    ),
    link: true,
  },
  [ErrorsCode.AppNotRegisteredV4]: {
    ...warningIcon,
    title: "App Not Found",
    centerTitle: true,
    padded: true,
    body: "Please create this app in the dev portal.",
    link: true,
  },
  [ErrorsCode.VerificationLevelNotSatisfied]: {
    ...warningIcon,
    title: "Credential not accepted",
    centerTitle: true,
    padded: true,
    body: (
      <>
        This identity can&apos;t produce a proof that satisfies the requested
        verification level. The app was sent a rejection.
      </>
    ),
  },
};

const fallbackContent: Content = {
  ...warningIcon,
  title: "Error",
  body: (
    <>
      Something went wrong <br /> Please try again later.
    </>
  ),
};

export default function ModalError(props: {
  errorCode: ErrorsCode | null;
  close: () => void;
}) {
  const content =
    props.errorCode != null
      ? errorContent[props.errorCode] ?? fallbackContent
      : fallbackContent;

  return (
    <div
      className={`flex h-[360px] flex-col items-center justify-center${
        content.padded ? " px-8" : ""
      }`}
    >
      <button
        className="absolute right-5 top-5 flex w-full justify-end"
        onClick={props.close}
      >
        <Icon
          name="close"
          className="size-6 text-black"
          bgClassName="h-9 w-9 rounded-full bg-gray-200"
        />
      </button>
      <Icon
        name={content.iconName}
        className={content.iconClassName}
        bgClassName={content.iconBgClassName}
        noMask={content.noMask}
      />
      <h2
        className={`mt-4 text-h2 font-bold text-gray-900${
          content.centerTitle ? " text-center" : ""
        }`}
      >
        {content.title}
      </h2>
      <p className="mt-4 text-center text-gray-500">{content.body}</p>
      {content.link && (
        <a
          className="mt-4 text-b3 font-medium text-info-700 underline"
          href={DEVELOPER_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          developer.world.org
        </a>
      )}
    </div>
  );
}
