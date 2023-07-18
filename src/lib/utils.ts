import type { Identity } from "@/types";
import { Chain, CredentialType } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ORB_SEQUENCER_STAGING, PHONE_SEQUENCER_STAGING } from "./constants";

export function encode(value: bigint): string {
  return "0x" + value.toString(16).padStart(64, "0");
}

export function isPendingInclusion(identity: Identity): boolean {
  const chainTypes = [Chain.Optimism, Chain.Polygon];
  const credentialTypes = [CredentialType.Orb, CredentialType.Phone];
  for (const chain of chainTypes) {
    const proofsForChain = identity.inclusionProof[chain];
    if (!proofsForChain) {
      continue;
    }
    for (const credentialType of credentialTypes) {
      const status = proofsForChain[credentialType]?.status;
      console.log(`status for ${chain} ${credentialType}: ${status}`);
      if (status === "new" || status === "pending") {
        return true;
      }
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
export const SEQUENCER_ENDPOINT: Record<CredentialType, string> = {
  [CredentialType.Orb]: ORB_SEQUENCER_STAGING,
  [CredentialType.Phone]: PHONE_SEQUENCER_STAGING,
};

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
