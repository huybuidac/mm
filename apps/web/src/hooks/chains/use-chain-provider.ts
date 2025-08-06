import { useMemo } from "react"
import { getProvider } from "@/lib/config"
import { MulticallWrapper } from "ethers-multicall-provider"

export const useChainProvider = (chainId: string) => {
    return useMemo(() => MulticallWrapper.wrap(getProvider(chainId)!), [chainId])
}