import type {
  InclusionProofResponse,
  InsertIdentityResponse,
  SequencerRequest,
} from "@/types";
import { CredentialType } from "@/types";

const SEQUENCER_PASSWORD: Record<CredentialType, string | undefined> = {
  [CredentialType.Orb]: process.env.ORB_SEQUENCER_PASSWORD,
  [CredentialType.Phone]: process.env.PHONE_SEQUENCER_PASSWORD,
};

const SEQUENCER_ENDPOINT: Record<CredentialType, string> = {
  [CredentialType.Orb]: "https://signup-v2.stage-crypto.worldcoin.dev/",
  [CredentialType.Phone]: "https://phone-signup-v2.stage-crypto.worldcoin.dev/",
};

function buildUrl(pathname: string, credentialType: CredentialType) {
  return new URL(pathname, SEQUENCER_ENDPOINT[credentialType]);
}

function buildHeaders(
  authenticate: boolean,
  credentialType: CredentialType,
): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authenticate) {
    headers.Authorization = `Basic ${btoa(
      `worldcoin:${SEQUENCER_PASSWORD[credentialType]}`,
    )}`;
  }
  return headers;
}

async function postRequest<T = unknown>(request: SequencerRequest): Promise<T> {
  if (request.authenticate && !SEQUENCER_PASSWORD[request.credentialType]) {
    throw new Error(
      `Sequencer password for '${request.credentialType}' is not provided and this request requires authentication. Please set SEQUENCER_PASSWORD environment variables.`,
    );
  }

  const response = await fetch(
    buildUrl(request.endpoint, request.credentialType).toString(),
    {
      method: "POST",
      body: JSON.stringify({ identityCommitment: request.commitment }),
      headers: buildHeaders(
        request.authenticate ?? false,
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
  commitment: string,
  credentialType: CredentialType,
) {
  return await postRequest<InclusionProofResponse>({
    endpoint: "inclusionProof",
    commitment,
    credentialType,
  });
}

export async function insertIdentity(
  commitment: string,
  credentialType: CredentialType,
) {
  return await postRequest<InsertIdentityResponse>({
    endpoint: "insertIdentity",
    commitment,
    credentialType,
    authenticate: true,
  });
}
