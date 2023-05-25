import type { MetadataResponse, SignResponse } from "@/types";
import { Status } from "@/types";
import { create } from "zustand";

export type IModalStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
  status: Status;
  setStatus: (status: Status) => void;
  metadata: MetadataResponse | null;
  setMetadata: (metadata: MetadataResponse | null) => void;
  topic: string | null;
  setTopic: (topic: string | null) => void;
  signResponse: SignResponse | null;
  setSignResponse: (signResponse: SignResponse | null) => void;
};

export const useModalStore = create<IModalStore>((set) => ({
  open: false,
  setOpen: (open) => set(() => ({ open })),
  status: Status.Waiting,
  setStatus: (status) => set(() => ({ status })),
  metadata: null,
  setMetadata: (metadata) => set(() => ({ metadata })),
  topic: null,
  setTopic: (topic) => set(() => ({ topic })),
  signResponse: null,
  setSignResponse: (signResponse) => set(() => ({ signResponse })),
}));
