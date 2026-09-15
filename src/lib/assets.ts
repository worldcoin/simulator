// Artwork bundled from World App (iOS asset catalogs and the credential-request
// CDN) so the simulator renders the same gem, badges, pills and status marks.
import credentialDevice from "@/assets/world-id/credential-request/credential-device.png";
import credentialMnc from "@/assets/world-id/credential-request/credential-mnc.png";
import credentialOrb from "@/assets/world-id/credential-request/credential-orb.png";
import credentialPassport from "@/assets/world-id/credential-request/credential-passport.png";
import proofAge from "@/assets/world-id/credential-request/proof-age.png";
import proofFullName from "@/assets/world-id/credential-request/proof-full-name.png";
import proofHuman from "@/assets/world-id/credential-request/proof-human.png";
import proofLiveness from "@/assets/world-id/credential-request/proof-liveness.png";
import proofNationality from "@/assets/world-id/credential-request/proof-nationality.png";
import proofUniqueDocument from "@/assets/world-id/credential-request/proof-unique-document.png";
import holographicGem from "@/assets/world-id/holographic-gem.png";
import humanTextTexture from "@/assets/world-id/human-text-texture.png";
import humanVerifiedGlyph from "@/assets/world-id/human-verified-glyph.svg";
import checkBadge from "@/assets/world-id/icon-check-badge.svg";
import failure24 from "@/assets/world-id/icon-failure-24.svg";
import noQr from "@/assets/world-id/icon-no-qr.svg";
import success24 from "@/assets/world-id/icon-success-24.svg";
import warningGrey from "@/assets/world-id/icon-warning-grey.svg";
import orbFront from "@/assets/world-id/orb-front.png";
import passportEmblem from "@/assets/world-id/passport-emblem.svg";
import type { CredentialKind } from "@/lib/credentials";
import type { StaticImageData } from "next/image";

/** Next's image loader hands SVG imports back as `{ src }` static assets. */
const svg = (module: unknown): string => (module as { src: string }).src;

/** Bitmap artwork, for `next/image`. */
export const WORLD_ID_ART = {
  holographicGem,
  humanTextTexture,
  orbFront,
} satisfies Record<string, StaticImageData>;

/** Multi-color SVG artwork, for `AssetIcon` with `noMask`. */
export const WORLD_ID_ICONS = {
  humanVerifiedGlyph: svg(humanVerifiedGlyph),
  passportEmblem: svg(passportEmblem),
  checkBadge: svg(checkBadge),
  success24: svg(success24),
  failure24: svg(failure24),
  noQr: svg(noQr),
  warningGrey: svg(warningGrey),
};

export type ProofArt =
  | "age"
  | "full-name"
  | "human"
  | "liveness"
  | "nationality"
  | "unique-document";

/** Proof icons shown in the request sheet and the credential details. */
export const PROOF_ART: Record<ProofArt, StaticImageData> = {
  human: proofHuman,
  "unique-document": proofUniqueDocument,
  liveness: proofLiveness,
  age: proofAge,
  "full-name": proofFullName,
  nationality: proofNationality,
};

/** Credential pill icons in the request sheet. */
export const CREDENTIAL_PILL_ART: Record<CredentialKind, StaticImageData> = {
  human: credentialOrb,
  passport: credentialPassport,
  id: credentialMnc,
  device: credentialDevice,
};
