import { useQueries, useQuery } from "@tanstack/react-query"
import { useChainProvider } from "../chains/use-chain-provider"
import { useMemo } from "react"
import { Erc20__factory } from "@/contracts/factories"

export const useWalletErc20Balance = (options: {address: string, chainId: string, tokenAddress: string}) => {
    const provider = useChainProvider(options.chainId)
    const erc20Contract = useMemo(() => Erc20__factory.connect(options.tokenAddress, provider), [options.tokenAddress, provider])
    return useQuery({
        queryKey: ['erc20-balance', options.address, options.chainId, options.tokenAddress],
        staleTime: 60000,
        queryFn: async () => {
            const balance = await erc20Contract.balanceOf(options.address)
            return {
                address: options.address,
                balance,
            }
        },
    })
}

export const useWalletErc20Balances = (options: {addresses: string[], chainId: string, tokenAddress: string}) => {
    const provider = useChainProvider(options.chainId)
    const erc20Contract = useMemo(() => Erc20__factory.connect(options.tokenAddress, provider), [options.tokenAddress, provider])
    return useQueries({
        queries: options.addresses.map(address => ({
            queryKey: ['erc20-balance', address, options.chainId, options.tokenAddress],
            staleTime: 60000,
            queryFn: async () => {
                const balance = await erc20Contract.balanceOf(address)
                return {
                    address,
                    balance,
                }
            },
        })),
        combine: (results) => {
            return results.filter(result => !!result.data).reduce((acc, result) => {
                acc[result.data!.address] = result.data!.balance
                return acc
            }, {} as Record<string, bigint>)
        },
    })
}