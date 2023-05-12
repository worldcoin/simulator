import * as BaseSwitch from "@radix-ui/react-switch";
import { memo } from "react";

// interface SwitchInterface {
//   className?: string;
//   checked?: boolean;
//   toggle: (value?: boolean) => void;
//   customColors?: {
//     checked?: string;
//     unchecked?: string;
//   };
// }

export const Switch = memo(function Switch() {
  return (
    <BaseSwitch.Root className="relative h-6 w-10 cursor-pointer rounded-full bg-000000 transition-colors">
      <BaseSwitch.Thumb className="pointer-events-none block h-5 w-5 translate-x-[2px] rounded-full bg-ffffff transition duration-500 ease-in-out checked:translate-x-2" />
    </BaseSwitch.Root>
  );
});

// import * as Switch from '@radix-ui/react-switch';
// import './styles.css';

// const SwitchDemo = () => (
//   <form>
//     <div style={{ display: 'flex', alignItems: 'center' }}>
//       <label className="Label" htmlFor="airplane-mode" style={{ paddingRight: 15 }}>
//         Airplane mode
//       </label>
//       <Switch.Root className="SwitchRoot" id="airplane-mode">
//         <Switch.Thumb className="SwitchThumb" />
//       </Switch.Root>
//     </div>
//   </form>
// );

// export default SwitchDemo;
