import { Environment } from "@/types";

type EncodedCommitment = string; // this should be a 64-padded hex-string

const SEQUENCER_PASSWORD = process.env.SEQUENCER_PASSWORD;

interface InclusionProofResponse {
  root: EncodedCommitment;
  proof: Record<"Left" | "Right", string>[];
}

const SEQUENCER_ENDPOINT: Record<Environment, string> = {
  [Environment.STAGING]: "https://signup.stage-crypto.worldcoin.dev/",
  [Environment.PRODUCTION]: "https://signup.crypto.worldcoin.dev/",
};

const getUrl = (pathname: string, env: Environment) =>
  new URL(pathname, SEQUENCER_ENDPOINT[env]);

async function postRequest<T = unknown>(
  endpoint: string,
  identityCommitment: EncodedCommitment,
  env: Environment,
  authenticateRequest?: boolean,
) {
  if (authenticateRequest && !SEQUENCER_PASSWORD) {
    throw "Sequencer password is not provided and this request requires authentication. Please set `SEQUENCER_PASSWORD` env var.";
  }
  const res = await fetch(getUrl(endpoint, env).toString(), {
    method: "POST",
    body: JSON.stringify([1, identityCommitment]),
    headers: {
      "Content-Type": "application/json",
      ...(authenticateRequest
        ? { Authorization: `Basic ${btoa(`worldcoin:${SEQUENCER_PASSWORD}`)}` }
        : {}),
    },
  });
  if (!res.ok)
    throw new TypeError(
      `Failed to call ${endpoint} [${res.status}]: ${res.statusText}`,
    );
  return (await res.json()) as Promise<T>;
}

export async function insertIdentity(
  identityCommitment: EncodedCommitment,
  env: Environment = Environment.STAGING,
) {
  return await postRequest<{
    identityIndex: number;
  }>("insertIdentity", identityCommitment, env, true);
}

export async function inclusionProof(
  identityCommitment: EncodedCommitment,
  env: Environment = Environment.STAGING,
) {
  return await postRequest<InclusionProofResponse>(
    "inclusionProof",
    identityCommitment,
    env,
  );
}
