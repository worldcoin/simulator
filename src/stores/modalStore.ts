import type { MetadataResponse, SessionEvent } from "@/types";
import { Status } from "@/types";
import { create } from "zustand";

export type IModalStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
  status: Status;
  setStatus: (status: Status) => void;
  metadata: Partial<MetadataResponse> | null;
  setMetadata: (metadata: Partial<MetadataResponse> | null) => void;
  event: SessionEvent | null;
  setEvent: (event: SessionEvent | null) => void;
  reset: () => void;
};

export const useModalStore = create<IModalStore>((set) => ({
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
  reset: () =>
    set(() => ({
      open: false,
      status: Status.Loading,
      metadata: null,
      event: null,
      request: null,
    })),
}));
