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

export type ParseWorldIDQRCodeOutput =
  | {
      valid: false;
      requestUUID?: never;
      bridgeURL?: never;
      key?: never;
      errorMessage: string;
    }
  | {
      valid: true;
      requestUUID: string;
      bridgeURL: string;
      key: string;
      errorMessage?: never;
    };
