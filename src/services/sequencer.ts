import { SEQUENCER_ENDPOINT } from "@/lib/utils";
import type { InclusionProofResponse, SequencerRequest } from "@/types";
import { CredentialType } from "@/types";

const SEQUENCER_STAGING_PASSWORD: Record<CredentialType, string | undefined> = {
  [CredentialType.Orb]: process.env.POLYGON_ORB_SEQUENCER_STAGING_PASSWORD,
  [CredentialType.Device]: process.env.POLYGON_PHONE_SEQUENCER_STAGING_PASSWORD,
};

function buildUrl(endpoint: string, credentialType: CredentialType) {
  return new URL(endpoint, SEQUENCER_ENDPOINT[credentialType]);
}

function buildHeaders(authenticate: boolean, credentialType: CredentialType) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authenticate) {
    headers.Authorization = `Basic ${btoa(
      `worldcoin:${SEQUENCER_STAGING_PASSWORD[credentialType]}`,
    )}`;
  }
  return headers;
}

async function postRequest<T = unknown>(request: SequencerRequest): Promise<T> {
  if (
    request.authenticate &&
    !SEQUENCER_STAGING_PASSWORD[request.credentialType]
  ) {
    throw new Error(
      `Sequencer password for '${request.credentialType}' is not provided and this request requires authentication. Please set SEQUENCER_PASSWORD environment variables.`,
    );
  }

  const headers = buildHeaders(
    request.authenticate ?? false,
    request.credentialType,
  );

  const response = await fetch(
    buildUrl(request.endpoint, request.credentialType).toString(),
    {
      method: "POST",
      body: JSON.stringify({ identityCommitment: request.commitment }),
      headers: headers,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to call /${request.endpoint} on sequencer for '${request.credentialType}'`,
    );
  }

  return (await response.json()) as Promise<T>;
}

export async function inclusionProof(
  credentialType: CredentialType,
  commitment: string,
) {
  return await postRequest<InclusionProofResponse>({
    endpoint: "inclusionProof",
    credentialType,
    commitment,
  });
}

export async function insertIdentity(
  credentialType: CredentialType,
  commitment: string,
) {
  return await postRequest<Response>({
    endpoint: "insertIdentity",
    credentialType,
    commitment,
    authenticate: true,
  });
}
