export const MIN_TICK = -887272

export function calculateSqrtPriceX96(amount0: bigint, amount1: bigint) {
  const sqrtX96Price = sqrt((amount1 * 2n ** BigInt(96 * 2)) / amount0)
  return sqrtX96Price
}

export function sqrt(y: bigint) {
  let z = 0n
  if (y > 3n) {
    z = y
    let x = y / 2n + 1n
    while (x < z) {
      z = x
      x = (y / x + x) / 2n
    }
  } else if (y != 0n) {
    z = 1n
  } else {
    z = 0n
  }
  return z
}
