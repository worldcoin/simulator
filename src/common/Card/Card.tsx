import clsx from "clsx";
import dayjs from "dayjs";
import { Fragment, useMemo } from "react";
import { Icon } from "../Icon";
import styles from "./Card.module.css";

export function Card(props: {
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
        className={clsx(
          "absolute inset-0",
          'bg-[url("/images/card-bg-verified-front.svg")] bg-no-repeat bg-cover bg-[position:center]',
        )}
      />
    );

    const verifiedBack = (
      <div
        className={clsx(
          "absolute inset-0",
          'bg-[url("/images/card-bg-verified-back.svg")] bg-no-repeat bg-cover bg-[position:center]',
        )}
      />
    );

    const notVerified = (
      <div
        className={clsx(
          "absolute inset-0",
          'bg-[url("/images/card-bg-not-verified.svg")] bg-no-repeat bg-cover bg-[position:center]',
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
      className={clsx(
        styles.card,
        // FIXME: temp
        "w-[164px] h-[216px]",
        "relative ",
        "font-rubik",
      )}
    >
      <div
        className={clsx(styles["card--inner"], {
          [`${styles["animate-flip"]}`]: props.animate,
        })}
      >
        {/* NOTE: face */}
        <div
          className={clsx(styles["card--face-front"], {
            "bg-d9d9d9": !props.verified,
            "bg-191c20": props.verified,
          })}
        >
          {bg.front}

          {/* NOTE: left top simulator label */}
          <div className="absolute z-10 top-0 inset-x-0">
            <span
              className={clsx(
                "absolute top-0 left-0 py-1.5 px-2",
                "text-7 text-ffffff font-medium uppercase",
                "rounded-br-[4px]",
                {
                  "bg-191c20": !props.verified,
                  "bg-7357f5": props.verified,
                },
              )}
            >
              simulator
            </span>

            <Icon
              name="logo"
              className="w-3 h-3 absolute top-1.5 right-2"
            />
          </div>

          {/* NOTE: card body */}
          <div
            className={clsx(
              "absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%-3px)]",
              "grid justify-items-center gap-3",
            )}
          >
            {props.verified && (
              <Icon
                name="bead-verified"
                className="w-[50px] h-[50px]"
                noMask
              />
            )}

            {!props.verified && (
              <Icon
                name="bead-not-verified"
                className="w-[50px] h-[50px]"
                noMask
              />
            )}
            <div className="space-y-0.5 text-center">
              <p
                className={clsx("text-12 font-medium", {
                  "text-ffffff": props.verified,
                  "text-191c20": !props.verified,
                })}
              >
                Anonymous
              </p>

              <p
                className={clsx("text-5", {
                  "text-ffffff": props.verified,
                  "text-657080": !props.verified,
                })}
              >
                Proof of Personhood
              </p>
            </div>
          </div>

          {/* NOTE: left stats */}
          <div
            className={clsx(
              "absolute top-[26px] right-0 bottom-0",
              "flex justify-between",
              "text-5 uppercase [writing-mode:vertical-rl] -scale-100",
              "py-1.5 px-2.5 text-657080",
            )}
          >
            <div>
              <div>Phone</div>

              <div
                className={clsx({
                  "text-ffffff": props.verified && props.phoneVerified,
                  "text-191c20": !props.verified && props.phoneVerified,
                })}
              >
                {props.phoneVerified ? "Verified" : "Not Verified"}
              </div>
            </div>

            <div>
              <div>Biometrics</div>

              <div
                className={clsx({
                  "text-ffffff": props.verified && props.bioVerified,
                  "text-191c20": !props.verified && props.bioVerified,
                })}
              >
                {props.bioVerified ? "Verified" : "Not Verified"}
              </div>
            </div>

            <div>
              <div>Signed up</div>
              <div
                className={clsx({
                  "text-ffffff": props.verified,
                  "text-191c20": !props.verified,
                })}
              >
                {dayjs(props.signAt).format("MMM DD, YYYY")}
              </div>
            </div>
          </div>
        </div>

        {/* NOTE: back */}
        <div
          className={clsx(styles["card--face-back"], {
            "bg-d9d9d9": !props.verified,
            "bg-191c20": props.verified,
          })}
        >
          {bg.back}

          {props.verified && (
            <Fragment>
              <div
                className={clsx(
                  "absolute left-0 inset-y-0 [writing-mode:vertical-rl] -scale-100 break-all",
                  "grid grid-cols-[repeat(34,_1fr)]",
                  "px-1 py-2",
                  "text-ffffff/20 uppercase text-7 font-thin text-center",
                  "bg-191c20",
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
              <div className="absolute bottom-2 left-8 text-5 uppercase grid">
                <span className="text-ffffff">
                  Verified in {props.verifiedIn}
                </span>
                <span className="text-ffffff">
                  Expiration {dayjs(props.expiration).format("MMM DD, YYYY")}
                </span>
                <span className="text-ffffff/20">
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
