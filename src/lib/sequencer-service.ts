import { Environment } from "@/types";

type EncodedCommitment = string; // this should be a 64-padded hex-string

const SEQUENCER_ENDPOINT: Record<Environment, string> = {
  [Environment.STAGING]: "https://signup.stage-crypto.worldcoin.dev/",
  [Environment.PRODUCTION]: "https://signup.crypto.worldcoin.dev/",
};

const getUrl = (pathname: string, env: Environment) =>
  new URL(
    pathname,
    SEQUENCER_ENDPOINT[env] ?? SEQUENCER_ENDPOINT[Environment.STAGING],
  );

async function postRequest<T = unknown>(
  endpoint: string,
  identityCommitment: EncodedCommitment,
  env: Environment,
) {
  const res = await fetch(getUrl(endpoint, env).toString(), {
    method: "POST",
    body: JSON.stringify([1, identityCommitment]),
    headers: {
      "Content-Type": "application/json",
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
  }>("insertIdentity", identityCommitment, env);
}

export async function inclusionProof(
  identityCommitment: EncodedCommitment,
  env: Environment = Environment.STAGING,
) {
  return await postRequest<Record<"Left" | "Right", string>[]>(
    "inclusionProof",
    identityCommitment,
    env,
  );
}
