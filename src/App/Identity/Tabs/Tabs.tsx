import { TabsType } from "@/types";
import airdropSvg from "@static/airdrop.svg";
import userSvg from "@static/user.svg";
import walletSvg from "@static/wallet.svg";
import React from "react";
import { Tab } from "./Tab/Tab";

export const Tabs = React.memo(function Tabs(props: {
  currentTab: TabsType;
  setTab: React.Dispatch<React.SetStateAction<TabsType>>;
}) {
  return (
    <div className="grid grid-cols-3 justify-items-center">
      <Tab
        icon={walletSvg}
        name="wallet"
        tab={TabsType.Wallet}
        setTab={props.setTab}
        active={props.currentTab === TabsType.Wallet}
      />
      <Tab
        icon={airdropSvg}
        name="drops"
        tab={TabsType.Airdrops}
        setTab={props.setTab}
        active={props.currentTab === TabsType.Airdrops}
      />
      <Tab
        icon={userSvg}
        name="world id"
        tab={TabsType.WorldId}
        setTab={props.setTab}
        active={props.currentTab === TabsType.WorldId}
      />
    </div>
  );
});
