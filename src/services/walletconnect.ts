import { verifySemaphoreProof } from "@/lib/proof";
import type { Identity, SignRequest, SignResponse } from "@/types";
import { CredentialType, ProofError } from "@/types";
import type { FullProof } from "@semaphore-protocol/proof";
import { Core } from "@walletconnect/core";
import type {
  ICore,
  PairingTypes,
  SignClientTypes,
} from "@walletconnect/types";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import type { IWeb3Wallet } from "@walletconnect/web3wallet";
import { Web3Wallet } from "@walletconnect/web3wallet";
import { defaultAbiCoder as abi } from "ethers/lib/utils";

const WALLETCONNECT_PID = process.env.NEXT_PUBLIC_WALLETCONNECT_PID;

export let core: ICore;
export let client: IWeb3Wallet;
let identity: Identity;

function getTopic(uri: string): string | null {
  const topicRegex = /wc:([a-f0-9]+)@2/;
  const match = uri.match(topicRegex);
  return match ? match[1] : null;
}

function getHighestCredentialType(request: SignRequest): string {
  const {
    params: [{ credential_types }],
  } = request;

  // Orb credential always takes precedence over all other credential types
  return credential_types.includes("orb") ? "orb" : credential_types[0];
}

function buildResponse(
  id: number,
  request: SignRequest,
  fullProof: FullProof,
): SignResponse {
  const credential_type = getHighestCredentialType(request);

  return {
    id,
    jsonrpc: "2.0",
    result: {
      merkle_root: abi.encode(["uint256"], [fullProof.merkleTreeRoot]),
      nullifier_hash: abi.encode(["uint256"], [fullProof.nullifierHash]),
      proof: abi.encode(["uint256[8]"], [fullProof.proof]),
      credential_type,
    },
  };
}

async function approveRequest(
  topic: string,
  response: SignResponse,
): Promise<void> {
  await client.respondSessionRequest({
    topic,
    response,
  });
}

async function rejectRequest(
  topic: string,
  id: number,
  code: number,
  message: string,
): Promise<void> {
  await client.respondSessionRequest({
    topic,
    response: {
      id,
      jsonrpc: "2.0",
      error: {
        code,
        message,
      },
    },
  });
}

export async function createClient(id: Identity): Promise<void> {
  core = new Core({
    logger: "debug",
    projectId: WALLETCONNECT_PID,
  });
  client = await Web3Wallet.init({
    core,
    metadata: {
      name: "World ID Simulator",
      description: "The simulator for testing World ID verifications.",
      url: "https://id.worldcoin.org/",
      icons: ["https://worldcoin.org/icons/logo-small.svg"],
    },
  });
  identity = id;
}

export async function pairClient(
  uri: string,
): Promise<PairingTypes.Struct | void> {
  const pairings = core.pairing.getPairings();
  const topics = pairings.map((pairing) => pairing.topic);
  const topic = getTopic(uri);

  if (topic && !topics.includes(topic)) {
    return await core.pairing.pair({ uri });
  } else if (topic && topics.includes(topic)) {
    return await core.pairing.activate({ topic });
  } else {
    console.error("Invalid or expired WalletConnect URI, please try again.");
  }
}

export async function onSessionProposal(
  event: SignClientTypes.EventArguments["session_proposal"],
) {
  const { id, params } = event;
  const namespaces = buildApprovedNamespaces({
    proposal: params,
    supportedNamespaces: {
      eip155: {
        chains: ["eip155:1"],
        methods: ["world_id_v1"],
        events: ["accountsChanged"],
        accounts: ["eip155:1:0"],
      },
    },
  });

  try {
    await client.approveSession({
      id,
      namespaces,
    });
  } catch (error) {
    console.error(error);
    await client.rejectSession({
      id,
      reason: getSdkError("USER_REJECTED_METHODS"),
    });
  }
}

export async function onSessionRequest(
  event: SignClientTypes.EventArguments["session_request"],
): Promise<void> {
  const { id, params, topic } = event;
  const { request } = params;
  const credentialType = getHighestCredentialType(request);

  let verification: { verified: boolean; fullProof: FullProof };

  try {
    verification = await verifySemaphoreProof(
      request,
      identity,
      credentialType === "orb" ? CredentialType.Orb : CredentialType.Phone, // TODO
    );
  } catch (error) {
    console.error(`Error verifying semaphore proof, ${error}`);
    if (error instanceof ProofError) {
      await rejectRequest(topic, id, error.code, error.message);
      return;
    } else {
      await rejectRequest(topic, id, -32602, "generic_error");
      return;
    }
  }

  const response = buildResponse(id, request, verification.fullProof);
  await approveRequest(topic, response);
}

export async function onSessionDisconnect(
  event: SignClientTypes.EventArguments["session_delete"],
): Promise<void> {
  const topics = Object.keys(client.getActiveSessions());

  if (topics.includes(event.topic)) {
    await disconnectSessions([event.topic]);
  }
}

export async function disconnectPairings(topics: string[]): Promise<void> {
  await Promise.all(topics.map((topic) => core.pairing.disconnect({ topic })));
}

export async function disconnectSessions(topics: string[]): Promise<void> {
  await Promise.all(
    topics.map((topic) =>
      client.disconnectSession({
        topic,
        reason: getSdkError("USER_DISCONNECTED"),
      }),
    ),
  );
}
