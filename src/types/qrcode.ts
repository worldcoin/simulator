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

export interface ScanConstraints {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface QRScannerFrameProps {
  containerRef: MutableRefObject<HTMLElement | null>;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  qrPosition: Bounds | null;
  classNames?: string;
  valid?: boolean | null;
}

export interface QRScannerProps {
  className?: string;
  // NOTE: constraints in percents
  scanConstraints?: ScanConstraints;
  onScanSuccess?: (data: string) => Promise<void>;
  onClose?: () => void;
}

export interface QRScannerResultPoint {
  text: string;
  resultPoints: Array<{
    x: number;
    y: number;
    estimatedModuleSize: number;
    count?: number;
  }>;
}

export interface useQRScannerProps {
  cameraReady: boolean;
  streamRef: MutableRefObject<MediaStream | undefined>;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  scanConstraints?: ScanConstraints;
}

export interface ParseWorldIDQRCodeOutput {
  valid: boolean;
  errorMessage?: string;
  uri?: string;
}
