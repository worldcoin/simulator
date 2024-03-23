import type { AbiEncodedValue, IDKitConfig } from "@worldcoin/idkit-core";
import { VerificationLevel } from "@worldcoin/idkit-core";
import type { HashFunctionOutput } from "@worldcoin/idkit-core/hashing";

import {
  hashToField,
  packAndEncode,
  solidityEncode,
} from "@worldcoin/idkit-core/hashing";

import { Buffer } from "buffer/";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { encodePacked } from "viem";
import { ORB_SEQUENCER_STAGING, PHONE_SEQUENCER_STAGING } from "./constants";

export function encode(value: bigint): string {
  return "0x" + value.toString(16).padStart(64, "0");
}

/**
 * Encodes a BigInt value for output to other systems (e.g. nullifier hash or Merkle root)
 * @param value
 * @returns
 */
export function encodeBigInt(value: bigint): string {
  return encodePacked(["uint256"], [value]);
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
export const SEQUENCER_ENDPOINT: Record<VerificationLevel, string> = {
  [VerificationLevel.Orb]: ORB_SEQUENCER_STAGING,
  [VerificationLevel.Device]: PHONE_SEQUENCER_STAGING,
};

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const generateExternalNullifier = (
  app_id: IDKitConfig["app_id"],
  action: IDKitConfig["action"],
): HashFunctionOutput => {
  if (!action) return packAndEncode([["uint256", hashToField(app_id).hash]]);
  if (typeof action === "string") action = solidityEncode(["string"], [action]);

  return packAndEncode([
    ["uint256", hashToField(app_id).hash],
    ...action.types.map(
      (type, index) =>
        [type, (action as AbiEncodedValue).values[index]] as [string, unknown],
    ),
  ]);
};

const buffer_encode = (buffer: ArrayBuffer): string => {
  return Buffer.from(buffer).toString("base64");
};

export const buffer_decode = (encoded: string): ArrayBuffer => {
  return Buffer.from(encoded, "base64");
};

export const encryptRequest = async (
  key: CryptoKey,
  iv: ArrayBuffer,
  request: string,
): Promise<{ payload: string; iv: string }> => {
  const encoder = new TextEncoder();

  return {
    iv: buffer_encode(iv),
    payload: buffer_encode(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(request),
      ),
    ),
  };
};
