import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { Fragment, useMemo } from "react";
import { Icon } from "../Icon";
import styles from "./WorldID.module.css";

export default function WorldID(props: {
  className?: string;
  address?: string;
  animate?: boolean;
  bioVerified?: boolean;
  expiration?: Date;
  phoneVerified?: boolean;
  signAt?: Date;
  verified?: boolean;
  verifiedIn?: string;
  widVersion?: string;
}) {
  // NOTE: set background depend on verified
  const bg = useMemo(() => {
    const verifiedFront = (
      <div
        className={cn(
          "absolute inset-0",
          'bg-[url("/images/card-bg-verified-front.svg")] bg-cover bg-[position:center] bg-no-repeat',
        )}
      />
    );

    const verifiedBack = (
      <div
        className={cn(
          "absolute inset-0",
          'bg-[url("/images/card-bg-verified-back.svg")] bg-cover bg-[position:center] bg-no-repeat',
        )}
      />
    );

    const notVerified = (
      <div
        className={cn(
          "absolute inset-0",
          'bg-[url("/images/card-bg-not-verified.svg")] bg-cover bg-[position:center] bg-no-repeat',
        )}
      />
    );

    if (props.verified) {
      return { front: verifiedFront, back: verifiedBack };
    }

    return { front: notVerified, back: notVerified };
  }, [props.verified]);

  return (
    <div
      className={cn(
        props.className,
        styles.card,
        "h-full font-rubik xs:aspect-[327/435] xs:h-fit",
      )}
    >
      <div
        className={cn(styles["card--inner"], {
          [`${styles["animate-flip"]}`]: props.animate,
        })}
      >
        {/* NOTE: face */}
        <div
          className={cn(styles["card--face-front"], {
            "bg-gray-300": !props.verified,
          })}
        >
          {bg.front}

          {/* NOTE: card body */}
          <div
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[calc(-50%-5vw)] xs:translate-y-[calc(-50%-15px)]",
              "grid justify-items-center gap-3",
            )}
          >
            {props.verified && (
              <Icon
                name="bead-verified"
                className="h-[26.6vw] w-[26.6vw] xs:h-[100px] xs:w-[100px]"
                noMask
              />
            )}

            {!props.verified && (
              <Icon
                name="bead-not-verified"
                className="h-[26.6vw] w-[26.6vw] xs:h-[100px] xs:w-[100px]"
                noMask
              />
            )}
            <div className="space-y-0.5 text-center">
              <p
                className={cn("text-[6.4vw] font-medium uppercase xs:text-24", {
                  "text-white": props.verified,
                  "text-gray-900": !props.verified,
                })}
              >
                Anonymous
              </p>

              <p
                className={cn("text-[2.6vw] uppercase xs:text-10", {
                  "text-white": props.verified,
                  "text-gray-500": !props.verified,
                })}
              >
                Proof of Personhood
              </p>
            </div>
          </div>

          {/* NOTE: left stats */}
          <div
            className={cn(
              "absolute inset-y-0 right-0",
              "flex justify-between",
              "rotate-180 uppercase [writing-mode:vertical-rl]",
              "px-[3.7vw] py-[5.3vw] text-gray-500 xs:px-3.5 xs:py-5",
            )}
          >
            <div className="grid content-end gap-y-0.5">
              <div
                className={cn("text-[2.6vw] xs:text-10", {
                  "text-gray-400": props.verified,
                })}
              >
                Phone
              </div>

              <div
                className={cn("text-[3.2vw] xs:text-12", {
                  "text-white": props.verified && props.phoneVerified,
                  "text-gray-900": !props.verified && props.phoneVerified,
                })}
              >
                {props.phoneVerified ? "Verified" : "Not Verified"}
              </div>
            </div>

            <div className="grid content-end gap-y-0.5">
              <div
                className={cn("text-[2.6vw] xs:text-10", {
                  "text-gray-400": props.verified,
                })}
              >
                Biometrics
              </div>

              <div
                className={cn("text-[3.2vw] xs:text-12", {
                  "text-white": props.verified && props.bioVerified,
                  "text-gray-900": !props.verified && props.bioVerified,
                })}
              >
                {props.bioVerified ? "Verified" : "Not Verified"}
              </div>
            </div>

            <div className="grid content-end gap-y-0.5">
              <div
                className={cn("text-[2.6vw] xs:text-10", {
                  "text-gray-400": props.verified,
                })}
              >
                Signed up
              </div>

              <div
                className={cn("text-[3.2vw] xs:text-12", {
                  "text-white": props.verified,
                  "text-gray-900": !props.verified,
                })}
              >
                {dayjs(props.signAt).format("MMM DD, YYYY")}
              </div>
            </div>

            <Icon
              name="logo"
              className={cn("h-[6.4vw] w-[6.4vw] scale-x-[-1] xs:h-6 xs:w-6 ", {
                "text-gray-900": !props.verified,
                "text-white": props.verified,
              })}
            />
          </div>
        </div>

        {/* NOTE: back */}
        <div
          className={cn(styles["card--face-back"], {
            "bg-gray-300": !props.verified,
            "bg-gray-900": props.verified,
          })}
        >
          {bg.back}

          {props.verified && (
            <Fragment>
              <div
                className={cn(
                  "absolute inset-y-0 left-0 -scale-100 break-all [writing-mode:vertical-rl]",
                  "grid grid-cols-[repeat(34,_1fr)]",
                  "px-1 py-2",
                  "text-center text-7 font-thin uppercase text-white/20",
                  "bg-gray-900",
                )}
              >
                {`${"ORB<VERIFIED"}${dayjs(props.signAt).format(
                  "DDMMYYYY",
                )}${"<<<<<"}${props.address}
                  `
                  .split("")
                  .map((i, key) => (
                    <span key={key}>{i}</span>
                  ))}
              </div>
              <div className="absolute bottom-2 left-8 grid text-5 uppercase">
                <span className="text-white">
                  Verified in {props.verifiedIn}
                </span>
                <span className="text-white">
                  Expiration {dayjs(props.expiration).format("MMM DD, YYYY")}
                </span>
                <span className="text-white/20">
                  World ID {props.widVersion}
                </span>
              </div>
            </Fragment>
          )}
        </div>
      </div>
    </div>
  );
}
