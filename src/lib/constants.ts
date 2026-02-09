// Dev portal
const DEV_PORTAL_URL =
  process.env.NEXT_PUBLIC_DEV_PORTAL_URL ?? "https://developer.worldcoin.org";
export const DEV_PORTAL_PRECHECK_URL = `${DEV_PORTAL_URL}/api/v1/precheck/`;
export const DEV_PORTAL_PROOF_CONTEXT_URL = `${DEV_PORTAL_URL}/api/v4/proof-context/`;

export const ORB_SEQUENCER_STAGING_URL =
  "https://signup-orb-ethereum.stage-crypto.worldcoin.org";
export const PHONE_SEQUENCER_STAGING_URL =
  "https://signup-phone-ethereum.stage-crypto.worldcoin.org";
export const DOCUMENT_SEQUENCER_STAGING_URL =
  "https://signup-document.stage-crypto.worldcoin.org";
export const SECURE_DOCUMENT_SEQUENCER_STAGING_URL =
  "https://signup-document-secure.stage-crypto.worldcoin.org";

// Site Metadata
export const METADATA = {
  name: "Worldcoin Simulator",
  description: "The simulator for testing World ID verifications.",
  url: "https://id.worldcoin.org/",
  icons: ["https://worldcoin.org/icons/logo-small.svg"],
};

export const SERVICE_STATUS_URL = "https://status.worldcoin.org/api/services";
