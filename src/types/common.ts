import type { FullProof } from "@semaphore-protocol/proof";

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
  fullProof: FullProof;
  rawExternalNullifier: string;
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
