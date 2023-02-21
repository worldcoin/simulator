// export interface ApprovalRequestMetadata {
//   app_id: VerificationRequestParams["app_id"];
//   project_name: string;
//   description: string;
//   logo_image: string;
//   validated?: true;
//   nullifiers: [{ nullifier_hash: string }];
// }

export interface ApprovalRequestMetadata {
  app_id: string;
  project_name: string;
  description: string;
  logo_image: string;
  validated?: true;
  nullifiers: [{ nullifier_hash: string }];
}
