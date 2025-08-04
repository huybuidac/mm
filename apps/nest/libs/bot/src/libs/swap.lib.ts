import { ChainConfig, ChainConfigs, getProvider, USDC_DECIMALS } from '../config'
import { ethers, FixedNumber, formatUnits, Log, LogDescription, parseUnits } from 'ethers'
import {
  Factory__factory,
  NftPosition__factory,
  Quoterv2__factory,
  Routerv2__factory,
  UniswapPool__factory,
  Weth__factory,
} from '../contracts'
import { fnHelper } from '@app/helper/fn.helper'
import { calculateSqrtPriceX96, MIN_TICK } from '@app/helper/sqrtprice.helper'
import { get, set } from 'lodash'
import { DateTime } from 'luxon'

const pool = UniswapPool__factory.connect(ChainConfigs['11124'].usdc) // any
const allownaceCacheds: {
  [wallet: string]: {
    [chainId: string]: {
      [token: string]: {
        [spender: string]: true
      }
    }
  }
} = {}

export async function scanSwap(options: { token: string; chainId: string; fee?: number }) {
  const { token, chainId, fee = 10000 } = options
  const config = ChainConfigs[chainId]
  const provider = getProvider(chainId)

  const factory = Factory__factory.connect(config.uniswapv3.factory, provider)
  const poolAddress = await factory.getPool(token, config.weth, fee)
  const poolContract = UniswapPool__factory.connect(poolAddress, provider)

  const logs = await poolContract.queryFilter(poolContract.getEvent('Swap'), 11873495)
  console.log('logs', logs)
}

export async function getTokenPrice(options: { token: string; chainId: string; fee?: number }) {
  const { token, chainId, fee = 10000 } = options
  const config = ChainConfigs[chainId]
  const provider = getProvider(chainId)
  const quoter = Quoterv2__factory.connect(config.uniswapv3.quoter, provider)
  const [tokenOut] = await quoter.getFunction('quoteExactInputSingle').staticCall({
    tokenIn: token,
    tokenOut: config.weth,
    fee,
    amountIn: ethers.parseEther('1'),
    sqrtPriceLimitX96: 0,
  })
  const token2eth = fnHelper.fromDecimals(tokenOut, 18)
  const ethPrice = await this.getEthPrice()
  return token2eth.mul(ethPrice)
}

export async function buy(options: {
  runner: ethers.Wallet
  token: string
  ethAmount: bigint
  chainId: string
  fee?: number
}) {
  const { runner, token, ethAmount, chainId, fee = 10000 } = options
  const config = ChainConfigs[options.chainId]
  const router = Routerv2__factory.connect(config.uniswapv3.swapRouter, options.runner)
  const quoter = Quoterv2__factory.connect(config.uniswapv3.quoter, options.runner)

  const [tokenOut] = await quoter.getFunction('quoteExactInputSingle').staticCall({
    tokenIn: config.weth,
    tokenOut: token,
    fee,
    amountIn: ethAmount,
    sqrtPriceLimitX96: 0,
  })

  const swapTx = await router
    .exactInputSingle(
      {
        tokenIn: config.weth,
        tokenOut: token,
        fee,
        amountIn: ethAmount,
        amountOutMinimum: (tokenOut * 99n) / 100n, // 1% slippage
        recipient: runner.address,
        sqrtPriceLimitX96: 0,
      },
      {
        value: ethAmount,
      },
    )
    .then((x: any) => x.wait())
  return exactSwapEvent({ swapTx, token, chainId })
}

export function exactSwapEvent(options: { swapTx: any; token: string; chainId: string }) {
  const { swapTx, token, chainId } = options
  let swapLog: LogDescription
  let rawSwapLog: Log
  for (const log of swapTx.logs) {
    try {
      const parsedLog = pool.interface.parseLog(log)
      if (parsedLog?.name === 'Swap') {
        swapLog = parsedLog
        rawSwapLog = log
        break
      }
    } catch {}
  }

  const [sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick] = swapLog.args
  const weth = ChainConfigs[chainId].weth
  const [tokenAmount, ethAmount] =
    token < weth ? [BigInt(amount0), BigInt(amount1)] : [BigInt(amount1), BigInt(amount0)]
  const isBuy = tokenAmount < 0n
  return {
    tokenAmount: isBuy ? -tokenAmount : tokenAmount,
    ethAmount: isBuy ? ethAmount : -ethAmount,
    isBuy,
    amount0: BigInt(amount0),
    amount1: BigInt(amount1),
    sender,
    recipient,
    sqrtPriceX96,
    liquidity,
    tick,
    rawSwapLog,
    swapLog,
  }
}

export type ParsedSwapEventType = ReturnType<typeof exactSwapEvent>

export async function quoteExactEthOutput(options: { token: string; ethOut: bigint; chainId: string; fee?: number }) {
  const { token, ethOut, chainId, fee = 10000 } = options
  const config = ChainConfigs[chainId]
  const provider = getProvider(chainId)
  const quoter = Quoterv2__factory.connect(config.uniswapv3.quoter, provider)
  const [tokenIn] = await quoter.getFunction('quoteExactOutputSingle').staticCall({
    tokenIn: token,
    tokenOut: config.weth,
    fee,
    amount: ethOut,
    sqrtPriceLimitX96: 0,
  })
  return tokenIn
}

export async function sellExactToken(options: {
  runner: ethers.Wallet
  token: string
  tokenAmount: bigint
  chainId: string
  fee?: number
}) {
  const { runner, token, tokenAmount, chainId, fee = 10000 } = options
  const config = ChainConfigs[options.chainId]
  const router = Routerv2__factory.connect(config.uniswapv3.swapRouter, options.runner)
  const quoter = Quoterv2__factory.connect(config.uniswapv3.quoter, options.runner)

  await ensureApprovedToken(runner, chainId, token, config, tokenAmount)

  const [ethOut] = await quoter.getFunction('quoteExactInputSingle').staticCall({
    tokenIn: token,
    tokenOut: config.weth,
    fee,
    amountIn: tokenAmount,
    sqrtPriceLimitX96: 0,
  })

  // console.log('prepare to sell', {
  //   token,
  //   tokenAmount: formatUnits(tokenAmount, 18),
  //   estimatedEth: formatUnits(ethOut, 18),
  // })

  const ethOutMin = (ethOut * 99n) / 100n // 1% slippage
  const swapTx = await router.getFunction('exactInputSingle').populateTransaction({
    tokenIn: token,
    tokenOut: config.weth,
    fee,
    amountIn: tokenAmount,
    amountOutMinimum: ethOutMin,
    recipient: await router.getAddress(),
    sqrtPriceLimitX96: 0,
  })
  const unwrapEthTx = await router
    .getFunction('unwrapWETH9(uint256,address)')
    .populateTransaction(ethOutMin, runner.address)
  const receipt = await router['multicall(bytes[])']([swapTx.data, unwrapEthTx.data]).then((x: any) => x.wait())
  return exactSwapEvent({ swapTx: receipt, token, chainId })
  // const { amount0, amount1 } = swapEvent
  // const ethAmount = amount0 < 0n ? -amount0 : -amount1
  // return { ethAmount, swapEvent }
}

export async function sellExactEth(options: {
  runner: ethers.Wallet
  token: string
  ethOut: bigint
  chainId: string
  fee?: number
}) {
  const { runner, token, ethOut, chainId, fee = 10000 } = options
  const provider = getProvider(chainId)
  const config = ChainConfigs[options.chainId]
  const router = Routerv2__factory.connect(config.uniswapv3.swapRouter, options.runner)
  const quoter = Quoterv2__factory.connect(config.uniswapv3.quoter, options.runner)

  const [tokenIn] = await quoter.getFunction('quoteExactOutputSingle').staticCall({
    tokenIn: token,
    tokenOut: config.weth,
    fee,
    amount: ethOut,
    sqrtPriceLimitX96: 0,
  })

  const amountInMaximum = (tokenIn * 101n) / 100n
  await ensureApprovedToken(runner, chainId, token, config, amountInMaximum)

  // console.log('prepare to sell', {
  //   token,
  //   estimatedToken: formatUnits(tokenIn, 18),
  //   ethOut: formatUnits(ethOut, 18),
  // })

  const swapTx = await router.getFunction('exactOutputSingle').populateTransaction({
    tokenIn: token,
    tokenOut: config.weth,
    fee,
    amountOut: ethOut,
    amountInMaximum,
    recipient: await router.getAddress(),
    sqrtPriceLimitX96: 0,
  })

  const unwrapEthTx = await router
    .getFunction('unwrapWETH9(uint256,address)')
    .populateTransaction(ethOut, runner.address)
  const receipt = await router['multicall(bytes[])']([swapTx.data, unwrapEthTx.data]).then((x: any) => x.wait())
  return exactSwapEvent({ swapTx: receipt, token, chainId })
  // let timestamp = DateTime.now().toSeconds()
  // try {
  //   timestamp = (await provider.getBlock(receipt.blockNumber)).timestamp
  // } catch {}
  // const { amount0, amount1 } = swapEvent
  // // sell => token into pool -> find positive amount
  // const tokenAmount = amount0 > 0n ? amount0 : amount1
  // return { tokenAmount, timestamp, swapEvent }
}

async function ensureApprovedToken(
  runner: ethers.Wallet,
  chainId: string,
  token: string,
  config: ChainConfig,
  tokenAmount: bigint,
) {
  const approved = get(allownaceCacheds, [runner.address, chainId, token, config.uniswapv3.swapRouter], false)
  if (!approved) {
    const tokenContract = Weth__factory.connect(token, runner)
    // console.log('Token approve', {
    //   token,
    //   user: runner.address,
    //   spender: config.uniswapv3.swapRouter,
    // })
    const allowance = await tokenContract.allowance(runner.address, config.uniswapv3.swapRouter)
    if (allowance < tokenAmount) {
      console.log(`${runner.address} approve ${token} to ${config.uniswapv3.swapRouter}`)
      await tokenContract.approve(config.uniswapv3.swapRouter, ethers.MaxUint256).then((x: any) => x.wait())
    }
    set(allownaceCacheds, [runner.address, chainId, token, config.uniswapv3.swapRouter], true)
  }
}

export function approve(options: {
  runner: ethers.Wallet
  token: string
  amount: bigint
  spender: string
  nonce?: number
}) {
  const approveAbi = {
    inputs: [
      { internalType: 'address', name: 'guy', type: 'address' },
      { internalType: 'uint256', name: 'wad', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  }

  const usdcContract = new ethers.Contract(options.token, [approveAbi], options.runner)
  return usdcContract.approve(options.spender, options.amount, { nonce: options.nonce })
}

export async function createPool(options: {
  runner: ethers.Wallet
  token: string
  tokenAmount: bigint
  ethAmount: bigint
  chainId: string
  fee: number
  caller: string
  tickSpacing: number
}) {
  const { token, tokenAmount, ethAmount, chainId, fee, tickSpacing, runner, caller: recipient } = options

  const config = ChainConfigs[chainId]

  const nftPosition = config.uniswapv3.positionManager
  const wethContract = Weth__factory.connect(config.weth, runner)

  const [token0, token1, amount0, amount1] =
    config.weth < token ? [config.weth, token, ethAmount, tokenAmount] : [token, config.weth, tokenAmount, ethAmount]

  const sqrtX96Price = calculateSqrtPriceX96(amount0, amount1)

  const maxTick = Math.floor(-MIN_TICK / tickSpacing) * tickSpacing
  const minTick = Math.ceil(MIN_TICK / tickSpacing) * tickSpacing

  const positionManager = NftPosition__factory.connect(config.uniswapv3.positionManager, runner)

  const createPoolTx = await positionManager
    .createAndInitializePoolIfNecessary(token0, token1, fee, sqrtX96Price)
    .then((x: any) => x.wait())
  let pool: string
  createPoolTx.logs.forEach((log: any) => {
    try {
      const parsedLog = positionManager.interface.parseLog(log)
      if (parsedLog?.name === 'PoolCreated') {
        console.log('parsedLog', parsedLog)
        pool = parsedLog.args[4]
        console.log('pool', pool)
      }
    } catch {}
  })
  console.log('create pool=', pool)

  let nonce = await runner.provider.getTransactionCount(recipient)

  const txs = []
  txs.push(this.approve({ runner, token: token, amount: tokenAmount, spender: nftPosition, nonce: nonce++ }))
  txs.push(this.approve({ runner, token: config.weth, amount: ethAmount, spender: nftPosition, nonce: nonce++ }))
  txs.push(wethContract.deposit({ value: ethAmount, nonce: nonce++ }))
  txs.push(
    positionManager.mint(
      {
        fee: fee,
        token0: token0,
        token1: token1,
        tickLower: minTick,
        tickUpper: maxTick,
        amount0Desired: amount0,
        amount1Desired: amount1,
        amount0Min: 0,
        amount1Min: 0,
        deadline: ethers.MaxUint256,
        recipient,
      },
      { nonce: nonce++ },
    ),
  )

  await Promise.all(txs)
  return pool
}

export async function getEthPrice() {
  const chainId = '2741'
  const config = ChainConfigs[chainId] // mainnet

  const provider = getProvider(chainId)

  const weth = config.weth
  const usdc = config.usdc

  const quoter = Quoterv2__factory.connect(config.uniswapv3.quoter, provider)

  const [usdcOut] = await quoter.getFunction('quoteExactInputSingle').staticCall({
    tokenIn: weth,
    tokenOut: usdc,
    fee: 3000,
    amountIn: ethers.parseEther('1'),
    sqrtPriceLimitX96: 0,
  })

  return fnHelper.fromDecimals(usdcOut, USDC_DECIMALS)
}

export const swapLib = {
  scanSwap,
  getTokenPrice,
  buy,
  exactSwapEvent,
  quoteExactEthOutput,
  sellExactToken,
  sellExactEth,
  approve,
  createPool,
  getEthPrice,
}
