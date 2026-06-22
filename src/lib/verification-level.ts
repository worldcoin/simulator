import { VerificationLevel } from "@worldcoin/idkit-core";

export function levelSatisfies(
  requested: VerificationLevel,
  presented: VerificationLevel,
): boolean {
  if (presented === VerificationLevel.Orb) return true;
  if (presented === requested) return true;
  return (
    requested === VerificationLevel.Document &&
    presented === VerificationLevel.SecureDocument
  );
}
