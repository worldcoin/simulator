import type { ApprovalRequestMetadata } from "@/types/metadata";
import type { WalletConnectRequest } from "./init-walletconnect";

export async function fetchApprovalRequestMetadata(
  request: WalletConnectRequest,
): Promise<Partial<ApprovalRequestMetadata>> {
  const [{ externalNullifier, appName, signalDescription }] = request.params;
  const meta: Partial<ApprovalRequestMetadata> = {
    external_nullifer: externalNullifier,
    project_name: appName,
    description: signalDescription,
  };

  try {
    const req = await fetch(
      "https://gist.githubusercontent.com/paolodamico/82109c72601d80ba3bf04ba6da1469a5/raw/worldid-dev-metadata.json",
      {
        redirect: "follow",
        // current gist does not support passing credentials https://stackoverflow.com/questions/8074665/cross-origin-resource-sharing-with-credentials
        //  credentials: "include"
      },
    );
    if (!req.ok)
      throw new TypeError(
        `Failed to fetch metadata service: ${req.statusText}`,
      );
    const content = (await req.json()) as Record<string, unknown>;
    if (!(externalNullifier in content))
      throw new ReferenceError(
        `Unable to find ${externalNullifier} in metadata response: ${JSON.stringify(
          content,
        )}`,
      );
    Object.assign(meta, content[externalNullifier]);
    meta.validated = true;
  } catch (err) {
    console.error(err);
  }
  return meta;
}
