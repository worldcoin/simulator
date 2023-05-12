import Item from "@/components/Item";

export default function Credentials() {
  return (
    <div className="mt-12 flex flex-col px-2 pb-6 text-center xs:pb-0">
      <h1 className="font-sora text-26 font-semibold text-191c20">
        World ID credentials
      </h1>
      <p className="mt-4 font-rubik text-18 text-657080">
        Simulate and manage different verified credentials for your World ID.
      </p>
      <Item
        icon="orb"
        heading="Biometrics"
        text="Verify with a simulation of the Worldcoin Orb"
        className="mt-14 p-5"
        onClick={() => console.log("clicked")}
      />
      <Item
        icon="phone"
        heading="Phone number"
        text="Verify with a randomly generated phone number"
        className="mt-3 p-5"
        onClick={() => console.log("clicked")}
      />
    </div>
  );
}
