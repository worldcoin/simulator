import type { Identity } from "@/types";
import { Chain, CredentialType } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  OPTIMISM_ORB_SEQUENCER_STAGING,
  OPTIMISM_PHONE_SEQUENCER_STAGING,
  POLYGON_ORB_SEQUENCER_STAGING,
  POLYGON_PHONE_SEQUENCER_STAGING,
} from "./constants";

export function encode(value: bigint): string {
  return "0x" + value.toString(16).padStart(64, "0");
}

export function isPendingInclusion(
  identity: Identity,
  credentialTypes = [CredentialType.Orb, CredentialType.Phone],
): boolean {
  for (const credentialType of credentialTypes) {
    const status = identity.inclusionProof[credentialType]?.status;
    if (status === "new" || status === "pending") {
      return true;
    }
  }
  return false;
}

async function checkFilesInCache(files: string[]) {
  if (!("caches" in window)) {
    throw new Error("Browser does not support the Cache API");
  }

  const cacheKeys = await caches.keys();

  return Promise.all(
    files.map(async (file) => {
      const fileInCache = await Promise.all(
        cacheKeys.map((key) =>
          caches.open(key).then((cache) => cache.match(file)),
        ),
      );

      return fileInCache.some(Boolean);
    }),
  );
}

export async function checkCache(): Promise<boolean> {
  const files = ["/semaphore/semaphore.wasm", "/semaphore/semaphore.zkey"];
  const filesInCache = await checkFilesInCache(files);
  return filesInCache.every(Boolean);
}

export async function retryDownload(): Promise<void> {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        if (registration.active)
          registration.active.postMessage("RETRY_DOWNLOAD");
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

// Mappings
const POLYGON_SEQUENCER_ENDPOINT: Record<CredentialType, string> = {
  [CredentialType.Orb]: POLYGON_ORB_SEQUENCER_STAGING,
  [CredentialType.Phone]: POLYGON_PHONE_SEQUENCER_STAGING,
};

const OPTIMISM_SEQUENCER_ENDPOINT: Record<CredentialType, string | undefined> =
  {
    [CredentialType.Orb]: OPTIMISM_ORB_SEQUENCER_STAGING,
    [CredentialType.Phone]: OPTIMISM_PHONE_SEQUENCER_STAGING,
  };

export const SEQUENCER_ENDPOINT: Record<
  Chain,
  Record<CredentialType, string | undefined>
> = {
  [Chain.Polygon]: POLYGON_SEQUENCER_ENDPOINT,
  [Chain.Optimism]: OPTIMISM_SEQUENCER_ENDPOINT,
};

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
