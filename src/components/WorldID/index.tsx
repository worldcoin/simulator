import { cn } from "@/lib/utils";
import { useMemo } from "react";
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
        "h-full font-rubik no-select xs:aspect-[330/435] xs:h-fit",
      )}
    >
      <div
        className={cn(styles["card--inner"], {
          [`${styles["animate-flip"]}`]: props.animate,
        })}
      >
        {/* NOTE: face */}
        <div className={cn(styles["card--face-front"])}>
          {bg.front}

          {/* NOTE: left stats */}
        </div>

        {/* NOTE: back */}
        <div
          className={cn(styles["card--face-back"], {
            "bg-gray-300": !props.verified,
            "bg-gray-900": props.verified,
          })}
        >
          {bg.back}
        </div>
      </div>
    </div>
  );
}
