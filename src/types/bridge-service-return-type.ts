export type BridgeServiceReturnType<
  SuccessPayload extends Record<string, unknown> = NonNullable<unknown>,
> =
  | {
      success: false;
      error: Error;
    }
  | (SuccessPayload & {
      success: true;
    });
