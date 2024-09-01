const FRACBITS = 16;
const FRACUNIT = 1 << FRACBITS;

function fixedMul(a, b) {
  let product = (BigInt(a) * BigInt(b)) >> BigInt(FRACBITS);
  return Number(product);
}

function fixedDiv(a, b) {
  let result = (BigInt(a) << BigInt(FRACBITS)) / BigInt(b);
  return Number(result);
}

function convertToFixed(num) {
  return num * FRACUNIT;
}
