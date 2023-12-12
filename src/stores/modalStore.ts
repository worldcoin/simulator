import type {
  BridgeInitialData,
  Errors,
  MetadataResponse,
  Verification,
} from "@/types";

import { Status } from "@/types";
import { create } from "zustand";

export type ModalStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
  status: Status;
  setStatus: (status: Status) => void;
  errorCode: Errors | null;
  setErrorCode: (errorCode: Errors) => void;

  bridgeInitialData: BridgeInitialData | null;
  setBridgeInitialData: (bridgeInitialData: BridgeInitialData) => void;

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
  errorCode: null,
  setErrorCode: (errorCode) => set(() => ({ errorCode })),
  metadata: null,

  setMetadata: (metadata: Partial<MetadataResponse> | null) =>
    set((state) => ({
      metadata: { ...state.metadata, ...metadata },
    })),

  bridgeInitialData: null,
  setBridgeInitialData: (bridgeInitialData) =>
    set(() => ({ bridgeInitialData })),

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
