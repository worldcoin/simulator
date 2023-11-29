import type { ApproveRequestBody } from "@/pages/api/approve-request";
import type { MetadataResponse, Verification } from "@/types";
import { Status } from "@/types";
import { create } from "zustand";

type Payload = Omit<ApproveRequestBody["payload"], "credential_type"> & {
  credential_type?: string;
};

export type ModalStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
  status: Status;
  setStatus: (status: Status) => void;
  metadata: Partial<MetadataResponse> | null;
  setMetadata: (metadata: Partial<MetadataResponse> | null) => void;
  verification: Verification | null;
  setVerification: (verification: Verification | null) => void;
  reset: () => void;
  url: string;
  setUrl: (url: string) => void;
  payload: Payload | null;
  setPayload: (payload: Payload | null) => void;
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

  verification: null,
  setVerification: (verification) => set(() => ({ verification })),
  url: "",
  setUrl: (url) => set(() => ({ url })),
  payload: null,
  setPayload: (payload) => set(() => ({ payload })),

  reset: () =>
    set(() => ({
      open: false,
      status: Status.Loading,
      metadata: null,
      url: "",
      payload: null,
    })),
}));
