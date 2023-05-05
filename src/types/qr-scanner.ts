import type { MutableRefObject } from "react";

export type Bounds = [
  // x0
  number,
  // x1
  number,
  // y0
  number,
  // y1
  number,
];

interface ScanConstraints {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface QrScannerFrameProps {
  containerRef: MutableRefObject<HTMLElement | null>;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  qrPosition: Bounds | null;
  classNames?: string;
  valid?: boolean | null;
}

export interface QrScannerProps {
  className?: string;
  // NOTE: constraints in percents
  scanConstraints?: ScanConstraints;
  onScanSuccess?: (data: string) => Promise<void>;
  onClose?: () => void;
}

export interface QrScannerResultPoint {
  text: string;
  resultPoints: Array<{
    x: number;
    y: number;
    estimatedModuleSize: number;
    count?: number;
  }>;
}

export interface useQrScannerProps {
  cameraReady: boolean;
  streamRef: MutableRefObject<MediaStream | undefined>;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  scanConstraints?: ScanConstraints;
}
