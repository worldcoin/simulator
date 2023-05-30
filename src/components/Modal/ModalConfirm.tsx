import Button from "../Button";
import { Icon } from "../Icon";

interface ModalConfirmProps {
  isVerified?: boolean;
  handleClick: () => void;
}

export default function ModalConfirm(props: ModalConfirmProps) {
  const message = props.isVerified
    ? [
        "Your World ID identity is still pending inclusion ",
        <strong key="message">on-chain.</strong>,
        " This action will fail verification on-chain.",
      ]
    : ["You are trying to use an unverified identity to generate a proof."];

  return (
    <div className="flex flex-col items-center justify-center">
      <Icon
        name="info"
        className="h-10 w-10 text-gray-900"
        bgClassName="h-20 w-20 rounded-full bg-gray-200 mt-8"
      />
      <h2 className="mt-8 text-center font-sora text-h1">
        {props.isVerified ? "Identity pending" : "Unverified identity"}
      </h2>
      <p className="mt-4 text-center text-b1 text-gray-500">
        {message.map((part) => part)}
      </p>
      <Button
        onClick={props.handleClick}
        className="mb-8 mt-14 flex h-14 w-full items-center justify-center bg-gray-900 font-sora text-16 font-semibold text-white"
      >
        Continue anyway
      </Button>
    </div>
  );
}
