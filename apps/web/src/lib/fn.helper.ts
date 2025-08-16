import { FixedNumber } from 'ethers'

export function formatOnchain(props: {
  value?: bigint
  decimals?: number
  maxFractionDigits?: number
  minFractionDigits?: number
}) {
  const { maxFractionDigits = 5, minFractionDigits = 0, decimals = 18, value = 0n } = props
  const fxN = fnHelper.fromDecimals(value, decimals)
  const intl = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: minFractionDigits,
    notation: 'compact',
    compactDisplay: 'short',
  })
  return intl.format(fxN.toUnsafeFloat())
}

/**
 * Safe from function, return 0 if error
 * @notice decimals for BigNumber only
 * @param value
 * @param bigNumberDecimals for value is BigNumber, default is 9
 * @returns
 */
const from = (value: FixedNumber | number | string) => {
  return FixedNumber.fromString(value.toString())
}

/**
 * Safe from function, return 0 if error
 * @notice decimals for BigNumber only
 * @param value
 * @param bigNumberDecimals for value is BigNumber, default is 9
 * @returns
 */
const fromSafe = (value: number | string | undefined | null) => {
  try {
    return from(value || 0)
  } catch {
    return FixedNumber.fromValue(0)
  }
}

const fromDecimals = (value: bigint | string | number, decimals: number = 9) => {
  return FixedNumber.fromValue(value.toString(), decimals)
}

const fromDecimalsSafe = (value: bigint | string | number | undefined | null, decimals: number = 9) => {
  try {
    return fromDecimals(value || '0', decimals)
  } catch {
    return FnZero
  }
}

const cmp = (_this: FixedNumber, other: FixedNumber) => {
  const a = _this.toUnsafeFloat()
  const b = other.toUnsafeFloat()

  if (a < b) return -1
  if (a > b) return 1
  return 0
}

const gt = (a: FixedNumber, b: FixedNumber) => {
  return cmp(a, b) > 0
}

const gte = (a: FixedNumber, b: FixedNumber) => {
  return cmp(a, b) >= 0
}

const lt = (a: FixedNumber, b: FixedNumber) => {
  return cmp(a, b) < 0
}

const lte = (a: FixedNumber, b: FixedNumber) => {
  return cmp(a, b) <= 0
}

const eq = (a: FixedNumber, b: FixedNumber) => {
  return cmp(a, b) === 0
}

const min = (...args: FixedNumber[]) => {
  return args.reduce((acc, cur) => (cmp(acc, cur) < 0 ? acc : cur))
}

const max = (...args: FixedNumber[]) => {
  return args.reduce((acc, cur) => (cmp(acc, cur) > 0 ? acc : cur))
}

export const FnZero = FixedNumber.fromString('0')
export const Fn100 = FixedNumber.fromString('100')

export const fnHelper = {
  gt,
  gte,
  lt,
  lte,
  eq,
  min,
  max,
  from,
  fromSafe,
  fromDecimals,
  fromDecimalsSafe,
}
