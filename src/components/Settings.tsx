import Button from "@/components/Button";
import Header from "@/components/Header";
import Item from "@/components/Item";
import { useEffect, useState } from "react";

export default function Settings() {
  const [version, setVersion] = useState("2.0");

  // On initial load, check for package version
  useEffect(() => {
    void fetch("/version.json")
      .then((response) => response.json())
      .then((data: { version: string }) => setVersion(data.version));
  }, []);

  return (
    <div className="flex flex-col justify-between">
      <div>
        <Header
          heading="Settings"
          iconLeft="chevron-thick"
          onClickLeft={() => console.log("clicked")}
        />
        <Item
          icon="user"
          heading="Credentials"
          text="Manage your credentials"
          className="mt-5 p-4"
          iconClassName="text-ffffff"
          iconBgClassName="bg-9d50ff"
          onClick={() => console.log("clicked")}
        />
        <Item
          icon="note"
          heading="Identity commitment"
          text="Copy your identity commitment"
          className="mt-3 p-4"
          iconClassName="text-ffffff"
          iconBgClassName="bg-00c3b6"
          indicator="copy"
          onClick={() => console.log("clicked")}
        />
      </div>
      <Button
        className="mb-6 h-14 w-full bg-fff5f7 font-sora text-16 font-semibold text-ff5a76"
        onClick={() => console.log("clicked")}
      >
        Logout
      </Button>
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-14 text-9ba3ae">
        Version {version}
      </p>
    </div>
  );
}
