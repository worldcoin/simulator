export function encode(value: bigint): string {
  return "0x" + value.toString(16).padStart(64, "0");
}
