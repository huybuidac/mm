import { useQueries, useQuery } from "@tanstack/react-query"
import { useChainProvider } from "../chains/use-chain-provider"

export const useWalletEthBalance = (options: {address: string, chainId: string}) => {
    const provider = useChainProvider(options.chainId)
    return useQuery({
        queryKey: ['eth-balance', options.address, options.chainId],
        queryFn: async () => {
            const balance = await provider.getBalance(options.address)
            return {
                address: options.address,
                balance,
            }
        },
        enabled: !!provider,
    })
}

export const useWalletEthBalances = (options: {addresses: string[], chainId: string}) => {
    const provider = useChainProvider(options.chainId)
    return useQueries({
        queries: options.addresses.map(address => ({
            queryKey: ['eth-balance', address, options.chainId],
            queryFn: async () => {
                const balance = await provider.getBalance(address)
                return {
                    address,
                    balance,
                }
            },
            enabled: !!provider,
        })),
        combine: (results) => {
            return results.filter(result => !!result.data).reduce((acc, result) => {
                acc[result.data!.address] = result.data!.balance
                return acc
            }, {} as Record<string, bigint>)
        },
    })
}