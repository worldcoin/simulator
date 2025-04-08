import { SEQUENCER_ENDPOINT } from "@/lib/utils";
import type { InclusionProofResponse, SequencerRequest } from "@/types";
import { VerificationLevel } from "@worldcoin/idkit-core";

const SEQUENCER_STAGING_PASSWORD: Record<
  VerificationLevel,
  string | undefined
> = {
  [VerificationLevel.Orb]: process.env.POLYGON_ORB_SEQUENCER_STAGING_PASSWORD,
  [VerificationLevel.Device]:
    process.env.POLYGON_PHONE_SEQUENCER_STAGING_PASSWORD,
} as Record<VerificationLevel, string | undefined>;

function buildUrl(endpoint: string, verificationLevel: VerificationLevel) {
  return new URL(endpoint, SEQUENCER_ENDPOINT[verificationLevel]);
}

function buildHeaders(
  authenticate: boolean,
  verificationLevel: VerificationLevel,
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authenticate) {
    headers.Authorization = `Basic ${btoa(
      `worldcoin:${SEQUENCER_STAGING_PASSWORD[verificationLevel]}`,
    )}`;
  }
  return headers;
}

async function postRequest<T = unknown>(request: SequencerRequest): Promise<T> {
  if (
    request.authenticate &&
    !SEQUENCER_STAGING_PASSWORD[request.verificationLevel]
  ) {
    throw new Error(
      `Sequencer password for '${request.verificationLevel}' is not provided and this request requires authentication. Please set SEQUENCER_PASSWORD environment variables.`,
    );
  }

  const headers = buildHeaders(
    request.authenticate ?? false,
    request.verificationLevel,
  );

  const response = await fetch(
    buildUrl(request.endpoint, request.verificationLevel).toString(),
    {
      method: "POST",
      body: JSON.stringify({ identityCommitment: request.commitment }),
      headers: headers,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to call /${request.endpoint} on sequencer for '${request.verificationLevel}'`,
    );
  }

  return (await response.json()) as Promise<T>;
}

export async function inclusionProof(
  verificationLevel: VerificationLevel,
  commitment: string,
) {
  return await postRequest<InclusionProofResponse>({
    endpoint: "inclusionProof",
    verificationLevel,
    commitment,
  });
}

export async function insertIdentity(
  verificationLevel: VerificationLevel,
  commitment: string,
) {
  return await postRequest<Response>({
    endpoint: "insertIdentity",
    verificationLevel,
    commitment,
    authenticate: true,
  });
}
