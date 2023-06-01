import { SEQUENCER_ENDPOINT } from "@/lib/utils";
import type { InclusionProofResponse, SequencerRequest } from "@/types";
import { Chain, CredentialType } from "@/types";

const POLYGON_SEQUENCER_STAGING_PASSWORD: Record<
  CredentialType,
  string | undefined
> = {
  [CredentialType.Orb]: process.env.POLYGON_ORB_SEQUENCER_STAGING_PASSWORD,
  [CredentialType.Phone]: process.env.POLYGON_PHONE_SEQUENCER_STAGING_PASSWORD,
};

const OPTIMISM_SEQUENCER_STAGING_PASSWORD: Record<
  CredentialType,
  string | undefined
> = {
  [CredentialType.Orb]: process.env.OPTIMISM_ORB_SEQUENCER_STAGING_PASSWORD,
  // TODO: Add phone sequencer password for Optimism once deployed
  [CredentialType.Phone]: undefined,
};

// Password mapping stays here since it's only exposed on the backend
const SEQUENCER_PASSWORD: Record<
  Chain,
  Record<CredentialType, string | undefined>
> = {
  [Chain.Polygon]: POLYGON_SEQUENCER_STAGING_PASSWORD,
  [Chain.Optimism]: OPTIMISM_SEQUENCER_STAGING_PASSWORD,
};

function buildUrl(
  endpoint: string,
  chain: Chain,
  credentialType: CredentialType,
) {
  return new URL(endpoint, SEQUENCER_ENDPOINT[chain][credentialType]);
}

function buildHeaders(
  authenticate: boolean,
  chain: Chain,
  credentialType: CredentialType,
): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authenticate) {
    headers.Authorization = `Basic ${btoa(
      `worldcoin:${SEQUENCER_PASSWORD[chain][credentialType]}`,
    )}`;
  }
  return headers;
}

async function postRequest<T = unknown>(request: SequencerRequest): Promise<T> {
  if (
    request.authenticate &&
    !SEQUENCER_PASSWORD[request.chain][request.credentialType]
  ) {
    throw new Error(
      `Sequencer password for '${request.credentialType}' is not provided and this request requires authentication. Please set SEQUENCER_PASSWORD environment variables.`,
    );
  }

  const response = await fetch(
    buildUrl(
      request.endpoint,
      request.chain,
      request.credentialType,
    ).toString(),
    {
      method: "POST",
      body: JSON.stringify({ identityCommitment: request.commitment }),
      headers: buildHeaders(
        request.authenticate ?? false,
        request.chain,
        request.credentialType,
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to call ${request.endpoint} on sequencer for '${request.credentialType}', [${response.status}]: ${response.statusText}`,
    );
  }

  return (await response.json()) as Promise<T>;
}

export async function inclusionProof(
  chain: Chain,
  credentialType: CredentialType,
  commitment: string,
) {
  return await postRequest<InclusionProofResponse>({
    chain,
    endpoint: "inclusionProof",
    credentialType,
    commitment,
  });
}

export async function insertIdentity(
  chain: Chain,
  credentialType: CredentialType,
  commitment: string,
) {
  return await postRequest<Response>({
    chain,
    endpoint: "insertIdentity",
    credentialType,
    commitment,
    authenticate: true,
  });
}
