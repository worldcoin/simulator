import type { MetadataResponse, SessionEvent, Verification } from "@/types";
import { Status } from "@/types";
import { create } from "zustand";

export type ModalStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
  status: Status;
  setStatus: (status: Status) => void;
  metadata: Partial<MetadataResponse> | null;
  setMetadata: (metadata: Partial<MetadataResponse> | null) => void;
  event: SessionEvent | null;
  setEvent: (event: SessionEvent | null) => void;
  verification: Verification | null;
  setVerification: (verification: Verification | null) => void;
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
  event: null,
  setEvent: (event) => set(() => ({ event })),
  verification: null,
  setVerification: (verification) => set(() => ({ verification })),
  reset: () =>
    set(() => ({
      open: false,
      status: Status.Loading,
      metadata: null,
      event: null,
      request: null,
    })),
}));
