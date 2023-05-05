import type { IconType } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import clsx from "clsx";
import type { ReactNode } from "react";
import React from "react";

export const Card = React.memo(function Card(props: {
  icon: IconType;
  heading: string;
  text: ReactNode | string;
  className?: string;
  iconClassName?: string;
  iconBgClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className={clsx("rounded-16 bg-f9fafb p-5", props.className)}>
      <Icon
        name={props.icon}
        className={clsx("h-6 w-6 text-ffffff", props.iconClassName)}
        bgClassName={clsx(
          "h-10 w-10 bg-000000 rounded-12",
          props.iconBgClassName,
        )}
      />
      <h2 className="mt-5 font-rubik text-18 font-semibold text-191c20">
        {props.heading}
      </h2>
      <div className="mt-2 font-rubik text-14 text-657080">{props.text}</div>
      {props.children}
    </div>
  );
});

// const Card = React.memo(function Card(props: {
//   heading: string;
//   text: ReactNode | string;
//   className?: string;
//   tooltipText?: string;
//   icon: IconType;
// }) {
//   const {
//     getArrowProps,
//     getTooltipProps,
//     setTooltipRef,
//     setTriggerRef,
//     visible,
//   } = usePopperTooltip({
//     placement: "bottom",
//     offset: [0, 8],
//   });

//   return (
//     <div
//       className={clsx(
//         "grid grid-cols-auto/1fr gap-x-4 gap-y-1",
//         props.className,
//       )}
//     >
//       <Icon
//         name={props.icon}
//         className="row-span-2 h-8 w-8"
//         noMask
//       />
//       <h2 className="text-16 font-semibold text-183c4a">{props.heading}</h2>

//       <div className="relative text-14 leading-5 tracking-[-0.01em] text-777e90">
//         {props.text}
//         {props.tooltipText && (
//           <span
//             data-tip
//             data-for="tooltip"
//             className="relative pl-5"
//             ref={setTriggerRef}
//           >
//             <Icon
//               name="info"
//               className={clsx(
//                 "absolute left-[2px] top-[2px] h-4 w-4 rotate-180",
//                 { "text-191c20": visible },
//               )}
//             />
//           </span>
//         )}
//       </div>

//       {visible && (
//         <Tooltip
//           ref={setTooltipRef}
//           getTooltipProps={getTooltipProps({ className: "relative px-4 z-50" })}
//           getArrowProps={getArrowProps({
//             className: "absolute bg-transparent w-4 h-4 -top-1.5",
//           })}
//           backgroundColor="bg-191c20"
//           className="text-ffffff"
//           text={props.tooltipText ?? ""}
//         />
//       )}
//     </div>
//   );
// });

// export default Card;
