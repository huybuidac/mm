import { Quoterv2__factory } from "@/contracts";
import { ChainConfigs, getProvider } from "./config";

export async function quoteExactTokenInput(options: { token: string; tokenIn: bigint; chainId: string; fee: number }) {
  const { token, tokenIn, chainId, fee } = options
  const config = ChainConfigs[chainId]
  const provider = getProvider(chainId)
  const quoter = Quoterv2__factory.connect(config.uniswapv3.quoter, provider)
  const [ethOut] = await quoter.getFunction('quoteExactInputSingle').staticCall({
    tokenIn: token,
    tokenOut: config.weth,
    fee,
    amountIn: tokenIn,
    sqrtPriceLimitX96: 0,
  })
  return ethOut
}