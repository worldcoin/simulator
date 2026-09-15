import assert from "node:assert/strict";
import { test } from "node:test";
import { nextIdentityNumber } from "../src/lib/identities";

const withNumbers = (numbers: number[]) =>
  numbers.map((idNumber) => ({
    meta: { name: `Identity #${idNumber}`, idNumber },
  }));

test("an empty list starts at zero", () => {
  assert.equal(nextIdentityNumber([]), 0);
});

test("continues after the highest number, not the list length", () => {
  assert.equal(nextIdentityNumber(withNumbers([4, 3, 2, 1, 0])), 5);
  // A duplicated store must not inflate the next number.
  assert.equal(
    nextIdentityNumber(withNumbers([4, 3, 2, 1, 0, 4, 3, 2, 1, 0])),
    5,
  );
  // Gaps are fine; the next number follows the highest one.
  assert.equal(nextIdentityNumber(withNumbers([0, 7])), 8);
  assert.equal(nextIdentityNumber(withNumbers([50, 4, 3, 2, 1, 0])), 51);
});
