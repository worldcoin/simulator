import type { Identity } from "@/types";
import { Environment } from "@/types";
import { defaultAbiCoder as abi } from "@ethersproject/abi";

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
  identity: Pick<Identity, "commitment">,
  env: Environment,
) {
  const commitment = abi.encode(["uint256"], [identity.commitment]);
  const res = await fetch(getUrl(endpoint, env).toString(), {
    method: "POST",
    body: JSON.stringify([1, commitment]),
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

export async function insertIdentity<T = unknown>(
  identity: Pick<Identity, "commitment">,
  env: Environment = Environment.STAGING,
) {
  return await postRequest<T>("insertIdentity", identity, env);
}

export async function inclusionProof(
  identity: Pick<Identity, "commitment">,
  env: Environment = Environment.STAGING,
) {
  return await postRequest<[Record<"left" | "right", string>]>(
    "inclusionProof",
    identity,
    env,
  );
}
