import { create } from "zustand";

type UiState = {
  scannerOpened: boolean;
  qrInputOpened: boolean;
  settingsOpened: boolean;
};

type UiActions = {
  setScannerOpened: (scannerOpened: boolean) => void;
  setQrInputOpened: (qrInputOpened: boolean) => void;
  setSettingsOpened: (settingsOpened: boolean) => void;
};

export type UiStore = UiActions & UiState;

export const useUiStore = create<UiStore>((set) => ({
  scannerOpened: false,
  qrInputOpened: false,
  settingsOpened: false,
  setScannerOpened: (scannerOpened) => set(() => ({ scannerOpened })),
  setQrInputOpened: (qrInputOpened) => set(() => ({ qrInputOpened })),
  setSettingsOpened: (settingsOpened) => set(() => ({ settingsOpened })),
}));
