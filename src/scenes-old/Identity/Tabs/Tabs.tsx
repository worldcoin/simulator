import { TabsType } from "@/types";
import React from "react";
import { Tab } from "./Tab/Tab";

export const Tabs = React.memo(function Tabs(props: {
  currentTab: TabsType;
  setTab: (tab: TabsType) => void;
}) {
  return (
    <div className="grid grid-cols-3 justify-items-center">
      <Tab
        icon="wallet"
        name="wallet"
        tab={TabsType.Wallet}
        setTab={props.setTab}
        active={props.currentTab === TabsType.Wallet}
      />
      <Tab
        icon="airdrop"
        name="drops"
        tab={TabsType.Airdrops}
        setTab={props.setTab}
        active={props.currentTab === TabsType.Airdrops}
      />
      <Tab
        icon="user"
        name="world id"
        tab={TabsType.WorldId}
        setTab={props.setTab}
        active={props.currentTab === TabsType.WorldId}
      />
    </div>
  );
});
