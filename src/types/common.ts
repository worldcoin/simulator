import type { FullProof } from "@semaphore-protocol/proof";
import type { NumericString } from "snarkjs";

export type FP = Omit<FullProof, "proof"> & { proof: NumericString[] };

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

export enum ErrorsCode {
  InputError = "input_error",
  BridgeFetchError = "bridge_fetch_error",
  BridgeNoData = "bridge_no_data",
  BridgeDecryptError = "bridge_decrypt_error",
  BridgeNoInitialData = "bridge_no_initial_data",
  QRCodeInvalid = "qr_code_invalid",
  ProofError = -32602,
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
