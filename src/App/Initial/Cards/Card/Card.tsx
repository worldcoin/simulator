import React from "react";
import Typography from "@/common/Typography/Typography";

const Card = React.memo(function Card(props: {
  number: number;
  title: string;
  text: string;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-auto/1fr gap-x-4 gap-y-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-f0f0fd font-sora text-16 font-semibold text-4940e0">
        {props.number}
      </div>

      <div>
        <Typography
          variant="s1"
          className="pt-2 !leading-4 text-gray-900"
        >
          {props.title}
        </Typography>

        <Typography
          variant="b3"
          className="mt-2 text-gray-500"
        >
          {props.text}
        </Typography>

        {props.hint && (
          <Typography
            variant="b3"
            className="mt-2 italic text-gray-400"
          >
            {props.hint}
          </Typography>
        )}
      </div>
    </div>
  );
});

export default Card;
