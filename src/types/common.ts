import type { FullProof } from "@semaphore-protocol/proof";
import type { NumericString } from "snarkjs";

export type FP = Omit<FullProof, "proof"> & { proof: NumericString[] };

export { CredentialType } from "@worldcoin/idkit-core";

export enum Environment {
  Production = "production",
  Staging = "staging",
}

export enum Status {
  Loading,
  Waiting,
  Pending,
  Success,
  Warning,
  Error,
}

export interface Verification {
  verified: boolean;
  fullProof: FP;
}

export interface ServiceStatusResponse {
  services: {
    name: string;
    id: string;
    description: string;
    status: string;
    logs: {
      id: number;
      datetime: number;
      status: string;
      name: string;
      description: string;
    }[];
    allUptimeRatio: string;
  }[];
  lastIncident: number;
}
