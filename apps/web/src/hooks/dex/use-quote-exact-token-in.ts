import { quoteExactTokenInput } from "@/lib/swap.lib"
import { useQuery } from "@tanstack/react-query"

export const useQuoteExactTokenIn = (options: { token: string, tokenIn: string, chainId: string, fee?: number }) => {
    const { token, tokenIn, chainId, fee } = options
    console.log('useQuoteExactTokenIn', options)
    return useQuery({
        enabled: !!token && !!tokenIn && !!chainId && !!fee,
        queryKey: ['quote-exact-token-in', token, tokenIn, chainId, fee],
        queryFn: async () => {
            if (BigInt(tokenIn) === 0n) return 0n
            const value = await quoteExactTokenInput({ token, tokenIn: BigInt(tokenIn), chainId, fee: fee! })
            return value
        }
    })
}