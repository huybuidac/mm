import { Quoterv2__factory } from "@/contracts";
import { BotTokenEntity } from "@/lib/api";
import { ChainConfigs, getProvider } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const useTokenValue = (token: BotTokenEntity, amount: bigint) => {
    const config = ChainConfigs[token.chainId]
    const quoterContract = useMemo(() => {
        const quoter = Quoterv2__factory.connect(config.uniswapv3.quoter, getProvider(token.chainId))
        return quoter
    }, [config, token.chainId])

    return useQuery({
        queryKey: ['tokenValue', token.address, config.weth, token.fee, amount],
        queryFn: async () => {
            const [ethOut] = await quoterContract.getFunction('quoteExactInputSingle').staticCall({
                tokenIn: token.address,
                tokenOut: config.weth,
                fee: token.fee,
                amountIn: amount,
                sqrtPriceLimitX96: 0,
            })
            return ethOut
        }
    })

    // const quote = useMemo(() => {
    //     const [ethOut] = await quoterContract.getFunction('quoteExactInputSingle').staticCall({
    //         tokenIn: token.address,
    //         tokenOut: config.weth,
    //         fee: token.fee,
    //         amountIn: amount,
    //         sqrtPriceLimitX96: 0,
    //     })
    //     return ethOut
    // }, [quoterContract, token.address, amount])

    // return quote
}