import type { CredentialType } from "./common";

export interface MetadataParams {
  app_id: string;
  action: string;
  signal: string;
  external_nullifier: string;
  nullifier_hash?: string;
  action_description?: string;
  credential_types: CredentialType[];
}

export interface MetadataResponse {
  id: string;
  is_staging: boolean;
  is_verified: boolean;
  logo_url: string;
  name: string;
  verified_app_logo: string;
  engine: string;
  sign_in_with_world_id: boolean;
  can_user_verify: string;
  action: Partial<ActionResponse>;
  __typename: string;
}

interface ActionResponse {
  external_nullifier: string;
  name: string;
  action: string;
  description?: string;
  max_verifications: number;
  max_accounts_per_user: number;
  status: string;
  __typename: string;
}
