import { fnHelper } from '@/lib/fn.helper'

export function FormatedOnchainNumber(props: {
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
  return <span>{intl.format(fxN.toUnsafeFloat())}</span>
}

export function FormatedOnchainNumberWithUnit(props: {
  value: bigint
  decimals: number
  unit: string
}) {
  return (
    <span>
      <FormatedOnchainNumber value={props.value} decimals={props.decimals} /> {props.unit}
    </span>
  )
}
