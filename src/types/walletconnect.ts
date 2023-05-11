export interface SignRequest {
  method: string;
  params: Record<string, string>[];
}

export interface SignResponse {
  id: number;
  jsonrpc: string;
  result: {
    merkle_root: string;
    nullifier_hash: string;
    proof: string;
    credential_type: string;
  };
}

// export interface ApprovalRequestMetadata {
//   app_id: string;
//   project_name: string;
//   description: string;
//   logo_image: string;
//   validated?: true;
//   nullifiers: [{ nullifier_hash: string }];
// }

// export interface VerificationRequest {
//   id: number;
//   jsonrpc: "2.0";
//   method: "world_id_v1";
//   params: VerificationRequestParams[];
// }

// export interface VerificationRequestParams {
//   app_id: string;
//   action: string;
//   signal: string;
//   action_description?: string;
//   external_nullifier: string;
// }
