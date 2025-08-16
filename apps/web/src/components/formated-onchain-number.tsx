import { formatOnchain } from '@/lib/fn.helper'

export function FormatedOnchainNumber(props: {
  value?: bigint
  decimals?: number
  maxFractionDigits?: number
  minFractionDigits?: number
}) {
  return <span>{formatOnchain(props)}</span>
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
