import type { CodedError } from "./errors";

export type BridgeServiceReturnType<
  SuccessPayload extends Record<string, unknown> = NonNullable<unknown>,
> =
  | {
      success: false;
      error: CodedError;
    }
  | (SuccessPayload & {
      success: true;
    });
