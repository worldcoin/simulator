export class ProofError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}
