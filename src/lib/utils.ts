import { CredentialType } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ORB_SEQUENCER_STAGING, PHONE_SEQUENCER_STAGING } from "./constants";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encode(value: bigint): string {
  return "0x" + value.toString(16).padStart(64, "0");
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

export const decryptRequest = async (
  key: CryptoKey,
  iv: ArrayBuffer,
  payload: string,
): Promise<string> => {
  return decoder.decode(
    await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      buffer_decode(payload),
    ),
  );
};

export const encryptResponse = async (
  key: CryptoKey,
  iv: ArrayBuffer,
  request: string,
): Promise<string> => {
  return buffer_encode(
    await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(request),
    ),
  );
};

export const buffer_encode = (buffer: ArrayBuffer): string => {
  return Buffer.from(buffer).toString("base64");
};

export const buffer_decode = (encoded: string): ArrayBuffer => {
  return Buffer.from(encoded, "base64");
};
