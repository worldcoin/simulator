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

export interface ParseWorldIDQRCodeOutput {
  valid: boolean;
  key?: CryptoKeyPair;
  errorMessage?: string;
  bridgeUrl?: string | null;
}
