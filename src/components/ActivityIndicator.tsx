import { cn } from "@/lib/utils";

/**
 * World App's ActivityIndicator: a faint circular track with a short arc that
 * completes one rotation every 0.4s. Inherits its color from `currentColor`.
 */
export function ActivityIndicator(props: {
  size?: number;
  lineWidth?: number;
  className?: string;
  label?: string;
}) {
  const size = props.size ?? 24;
  const lineWidth = props.lineWidth ?? (size <= 24 ? 2.5 : 4);
  const radius = (size - lineWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0 animate-indicator", props.className)}
      role="status"
      aria-label={props.label ?? "Loading"}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.16}
        strokeWidth={lineWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={lineWidth}
        strokeDasharray={`${circumference * 0.17} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
