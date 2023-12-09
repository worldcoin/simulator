import type { BridgeInitialData } from "@/pages/api/pair-client";
import type { FP, MetadataResponse, Verification } from "@/types";
import { Status } from "@/types";
import { create } from "zustand";

export type ModalStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
  status: Status;
  setStatus: (status: Status) => void;

  bridgeInitialData: BridgeInitialData | null;
  setBridgeInitialData: (bridgeInitialData: BridgeInitialData) => void;

  fullProof: FP | null;
  setFullProof: (fullProof: FP) => void;

  metadata: Partial<MetadataResponse> | null;
  setMetadata: (metadata: Partial<MetadataResponse> | null) => void;
  verification: Verification | null;
  setVerification: (verification: Verification | null) => void;
  url: string;
  setUrl: (url: string) => void;
  reset: () => void;
};

export const useModalStore = create<ModalStore>((set) => ({
  open: false,
  setOpen: (open) => set(() => ({ open })),
  status: Status.Loading,
  setStatus: (status) => set(() => ({ status })),
  metadata: null,

  setMetadata: (metadata: Partial<MetadataResponse> | null) =>
    set((state) => ({
      metadata: { ...state.metadata, ...metadata },
    })),

  bridgeInitialData: null,
  setBridgeInitialData: (bridgeInitialData) =>
    set(() => ({ bridgeInitialData })),

  fullProof: null,
  setFullProof: (fullProof) => set(() => ({ fullProof })),

  verification: null,
  setVerification: (verification) => set(() => ({ verification })),
  url: "",
  setUrl: (url) => set(() => ({ url })),

  reset: () =>
    set(() => ({
      open: false,
      status: Status.Loading,
      bridgeInitialData: null,
      url: "",
    })),
}));
