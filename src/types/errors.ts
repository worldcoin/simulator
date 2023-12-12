import type { Errors } from "./common";

export class CodedError extends Error {
  code: Errors;

  constructor(code: Errors, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}
