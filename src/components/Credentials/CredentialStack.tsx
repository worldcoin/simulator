import type { CredentialDefinition, CredentialKind } from "@/lib/credentials";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CredentialCard } from "./CredentialCard";

/** Vertical offset between stacked cards, as in World App's credential hub. */
export const CARD_SPACING = 70;

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

/**
 * Cards fan out 70pt apart. Tapping one lifts it to the top; the cards above
 * it tuck in behind it, shrunk and blurred, and the cards below fade away.
 */
export function CredentialStack(props: {
  credentials: CredentialDefinition[];
  focused: CredentialKind | null;
  onFocus: (kind: CredentialKind | null) => void;
}) {
  const count = props.credentials.length;
  const focusedIndex = props.focused
    ? props.credentials.findIndex((c) => c.kind === props.focused)
    : -1;
  const hasFocus = focusedIndex >= 0;

  return (
    <motion.div
      className="relative"
      animate={{ marginBottom: hasFocus ? -(count - 1) * CARD_SPACING : 0 }}
      transition={spring}
    >
      {props.credentials.map((credential, index) => {
        const isFocused = index === focusedIndex;
        const isAbove = hasFocus && index < focusedIndex;
        const isBelow = hasFocus && index > focusedIndex;

        return (
          <motion.button
            key={credential.kind}
            type="button"
            aria-expanded={isFocused}
            aria-hidden={isBelow || undefined}
            aria-label={`${credential.title} credential`}
            disabled={isBelow}
            onClick={() => props.onFocus(isFocused ? null : credential.kind)}
            className={cn(
              "relative block w-full rounded-14 text-left outline-none focus-visible:ring-2 focus-visible:ring-stroke-primary/30",
              // Percentage margins resolve against the width, so this is
              // exactly `70px - cardHeight` for a 100:63 card.
              { "mt-[calc(70px_-_63%)]": index > 0 },
              // Faded cards must neither paint over the details nor take taps.
              { "pointer-events-none": isBelow },
            )}
            style={{ zIndex: isFocused ? count + 1 : index }}
            animate={{
              // Everything up to the focused card collapses to the top so the
              // focused card covers the ones above it; the rest drops away.
              y:
                hasFocus && !isBelow ? -index * CARD_SPACING : isBelow ? 24 : 0,
              scale: isAbove ? 1 - 0.05 * (focusedIndex - index) : 1,
              opacity: isBelow ? 0 : 1,
              filter: isAbove
                ? "blur(3px)"
                : isBelow
                ? "blur(12px)"
                : "blur(0px)",
            }}
            whileTap={{ scale: 0.985 }}
            transition={spring}
          >
            <CredentialCard credential={credential} />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
