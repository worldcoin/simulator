import type { ErrorsCode } from "./common";

export class CodedError extends Error {
  code: ErrorsCode;

  constructor(code: ErrorsCode, message?: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}
