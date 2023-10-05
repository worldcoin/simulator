import type { MetadataParams, MetadataResponse, Verification } from "@/types";
import { Status } from "@/types";
import { create } from "zustand";

const DEFAULT_BRIDGE_URL = "https://bridge.id.worldcoin.org";

export type ModalStore = {
  open: boolean;
  status: Status;
  bridgeUrl: string;
  key: CryptoKey | null;
  requestId: string | null;
  setOpen: (open: boolean) => void;
  setStatus: (status: Status) => void;
  metadata: Partial<MetadataResponse> | null;
  setMetadata: (metadata: Partial<MetadataResponse> | null) => void;
  setBridgeConfig: (
    key: CryptoKey,
    requestId: string,
    bridgeUrl: string | null,
  ) => Promise<void>;
  request: MetadataParams | null;
  setRequest: (event: MetadataParams | null) => void;
  verification: Verification | null;
  setVerification: (verification: Verification | null) => void;
  reset: () => void;
};

export const useModalStore = create<ModalStore>((set) => ({
  open: false,
  key: null,
  requestId: null,
  bridgeUrl: DEFAULT_BRIDGE_URL,
  setBridgeConfig: async (key, requestId, bridgeUrl) => {
    set(() => ({
      key,
      requestId,
      bridgeUrl: bridgeUrl ?? DEFAULT_BRIDGE_URL,
    }));
  },
  request: null,
  setRequest: (request) => set(() => ({ request })),
  setOpen: (open) => set(() => ({ open })),
  status: Status.Loading,
  setStatus: (status) => set(() => ({ status })),
  metadata: null,
  setMetadata: (metadata: Partial<MetadataResponse> | null) =>
    set((state) => ({
      metadata: { ...state.metadata, ...metadata },
    })),
  event: null,
  verification: null,
  setVerification: (verification) => set(() => ({ verification })),
  reset: () =>
    set(() => ({
      open: false,
      iv: null,
      key: null,
      status: Status.Loading,
      metadata: null,
      event: null,
      request: null,
    })),
}));
