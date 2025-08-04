import { Injectable } from '@nestjs/common'
import { DateTime, Duration } from 'luxon'
import { ethers, formatUnits } from 'ethers'
import { get, keyBy, maxBy, omit, pick, random, set, unionBy, uniq, uniqBy } from 'lodash'
import { MulticallWrapper } from 'ethers-multicall-provider'
import { ChainConfigs, getProvider } from './config'
import { Erc20__factory } from './contracts'
import { proH } from '@app/helper'
import { ParsedSwapEventType, swapLib } from './libs/swap.lib'
import { logl } from '@app/helper/log.helper'
import { PrismaService } from 'nestjs-prisma'
import randomstring from 'randomstring'

interface WalletState {
  wallet: ethers.Wallet
  address: string
  ethBalance: bigint
  tokenBalance: bigint
  buyable: boolean
  sellable: boolean
  priority: boolean
  buyWeight: number
  sellWeight: number
}

interface StartOptions {
  token: string
  chainId: string
  fee: number
  sellConfig: {
    wallets: ethers.Wallet[]
    volume: bigint
    totalOrder: bigint
    delay?: Duration
  }
  buyConfig: {
    wallets: ethers.Wallet[]
    volume: bigint
    totalOrder: bigint
  }
  priorityAddresses: string[]
  duration: Duration
}

@Injectable()
export class BotService {
  jobs = {}

  constructor(private readonly prisma: PrismaService) {}

  async stopTokenJob(token: string) {
    const jobId = get(this.jobs, [token])
    if (jobId) {
      logl(`${token} job[${jobId}] is interrupted`)
      set(this.jobs, [token], undefined)
    } else {
      logl(`${token} job is not running`)
    }
  }

  async start(options: StartOptions) {
    const jobId = randomstring.generate(7)
    const { token, chainId, sellConfig, buyConfig, duration, fee } = options
    const { getBuyWallets, getSellWallets } = await prepareForStart(options)

    const startTime = DateTime.now()
    const endTime = startTime.plus(duration)
    let nextBuyAt = DateTime.now()
    let nextSellAt = DateTime.now().plus(sellConfig.delay || { minute: 10 })

    set(this.jobs, [options.token], jobId)
    while (DateTime.now() < endTime && (buyConfig.totalOrder > 0 || sellConfig.totalOrder > 0)) {
      if (get(this.jobs, [options.token]) !== jobId) {
        logl(`[${jobId}] Bot stopped by another job`)
        break
      }
      logl(
        `[${jobId}] sellVolume: ${formatUnits(sellConfig.volume, 18)}, sellOrder: ${sellConfig.totalOrder}, buyVolume: ${formatUnits(buyConfig.volume, 18)}, buyOrder: ${buyConfig.totalOrder}`,
      )
      if (buyConfig.totalOrder > 0 && nextBuyAt <= DateTime.now()) {
        let ethAmount = buyConfig.volume / buyConfig.totalOrder
        if (buyConfig.totalOrder > 1n) {
          ethAmount = (ethAmount * BigInt(random(20, 180))) / 100n
          const remainLeft = random(3, 6)
          const length = ethAmount.toString().length
          if (length > remainLeft) {
            const clearRight = length - remainLeft
            ethAmount = (ethAmount / BigInt(10 ** clearRight)) * BigInt(10 ** clearRight)
          }
        }
        const validWallets = getBuyWallets().filter((x) => x.ethBalance > ethAmount)
        if (validWallets.length > 0) {
          const randomWallet = getRandomWallet(validWallets)
          try {
            logl(
              `[${jobId}][Buy-${buyConfig.totalOrder}][${randomWallet.wallet.address}] Buy with ${formatUnits(ethAmount, 18)} eth`,
            )
            const swapEvent = await swapLib.buy({
              runner: randomWallet.wallet,
              token,
              ethAmount,
              chainId,
              fee,
            })
            logl(
              `[${jobId}][Buy-${buyConfig.totalOrder}][${randomWallet.wallet.address}] Buy success with ${formatUnits(ethAmount, 18)} eth`,
            )
            randomWallet.ethBalance -= swapEvent.ethAmount
            randomWallet.tokenBalance += swapEvent.tokenAmount
            buyConfig.totalOrder -= 1n
            buyConfig.volume -= ethAmount

            await this.storeSwapEvent({ swapEvent, token, chainId })

            const currentTime = DateTime.now()
            if (currentTime < endTime && buyConfig.totalOrder > 0) {
              const remain = endTime.diff(currentTime).as('seconds')
              let waitDuration = buyConfig.totalOrder > 1n ? remain / Number(buyConfig.totalOrder) : remain
              waitDuration = Math.ceil((waitDuration * (buyConfig.totalOrder > 1n ? random(50, 150) : 100)) / 100)
              nextBuyAt = currentTime.plus({ seconds: waitDuration })
              logl(
                `[${jobId}][Buy-${buyConfig.totalOrder}] prepare next buy after ${waitDuration} seconds at ${nextBuyAt.toISO()}`,
              )
            }
          } catch (error) {
            console.error(`[${jobId}][Buy-${buyConfig.totalOrder}] Buy error`, error.message)
          }
        } else {
          logl(`[${jobId}][Buy-${buyConfig.totalOrder}] No valid wallets to buy with ${formatUnits(ethAmount, 18)} eth`)
        }
      }
      await proH.delay(5000)
      if (sellConfig.totalOrder > 0 && nextSellAt < DateTime.now()) {
        let ethVol = sellConfig.volume / sellConfig.totalOrder
        if (sellConfig.totalOrder > 1n) {
          ethVol = (ethVol * BigInt(random(20, 180))) / 100n
        }
        let estimatedTokenIn = await swapLib.quoteExactEthOutput({ token, ethOut: ethVol, chainId, fee })
        const validWallets = getSellWallets().filter((x) => x.tokenBalance > (estimatedTokenIn * 101n) / 100n)
        // logl(
        //   `[${sellConfig.totalOrder}] Sell with ${formatUnits(estimatedTokenIn, 18)} token in 1 of ${validWallets.length} wallets`,
        // )
        if (validWallets.length > 0) {
          try {
            const randomWallet = getRandomWallet(validWallets)
            const swapType = random(1, 2)
            let swapEvent: ParsedSwapEventType
            if (swapType === 1) {
              // exact eth out
              logl(
                `[${jobId}][Sell-${sellConfig.totalOrder}][${randomWallet.wallet.address}] Sell to take ${formatUnits(ethVol, 18)} eth`,
              )
              swapEvent = await swapLib.sellExactEth({
                runner: randomWallet.wallet,
                token,
                ethOut: ethVol,
                chainId,
                fee,
              })
            } else {
              // exact token in
              const remainLeft = random(1, 5)
              const length = estimatedTokenIn.toString().length
              if (length > remainLeft) {
                const clearRight = length - remainLeft
                estimatedTokenIn = (estimatedTokenIn / BigInt(10 ** clearRight)) * BigInt(10 ** clearRight)
              }
              logl(
                `[${jobId}][Sell-${sellConfig.totalOrder}][${randomWallet.wallet.address}] Sell with ${formatUnits(estimatedTokenIn, 18)} token`,
              )
              swapEvent = await swapLib.sellExactToken({
                runner: randomWallet.wallet,
                token,
                tokenAmount: estimatedTokenIn,
                chainId,
                fee,
              })
            }
            logl(
              `[${jobId}][Sell-${sellConfig.totalOrder}][${randomWallet.wallet.address}] Sell success ${formatUnits(swapEvent.tokenAmount, 18)} token to ${formatUnits(swapEvent.ethAmount, 18)} eth`,
            )
            randomWallet.ethBalance += swapEvent.ethAmount
            randomWallet.tokenBalance -= swapEvent.tokenAmount
            sellConfig.totalOrder -= 1n
            sellConfig.volume += swapEvent.ethAmount
          } catch (error) {
            console.error(`[${jobId}][Sell-${sellConfig.totalOrder}] Sell error`, error.message)
          }
        }
        const currentTime = DateTime.now()
        if (currentTime < endTime && sellConfig.totalOrder > 0) {
          const remain = endTime.diff(currentTime).as('seconds')
          let waitDuration = sellConfig.totalOrder > 1n ? remain / Number(sellConfig.totalOrder) : remain
          waitDuration = Math.ceil((waitDuration * (sellConfig.totalOrder > 1n ? random(50, 150) : 100)) / 100)
          nextSellAt = currentTime.plus({ seconds: waitDuration })
          logl(
            `[${jobId}][Sell-${sellConfig.totalOrder}] prepare next sell after ${waitDuration} seconds at ${nextSellAt.toISO()}`,
          )
        }
      }
      await proH.delay(5000)
    }
    set(this.jobs, [options.token], undefined)
    const diff = DateTime.now().diff(startTime).as('seconds')
    logl(`[${jobId}] Bot stopped in ${diff} seconds`)
  }

  private async storeSwapEvent(options: { swapEvent: ParsedSwapEventType; token: string; chainId: string; jobId?: string }) {
    const { swapEvent, token, chainId, jobId } = options
    const weth = ChainConfigs[chainId].weth

    const [tokenAmount, ethAmount] = token < weth ? [swapEvent.amount0, swapEvent.amount1] : [swapEvent.amount1, swapEvent.amount0]

    await this.prisma.tokenSwap.upsert({
      where: {
        txHash_index: {
          txHash: swapEvent.rawSwapLog.transactionHash,
          index: swapEvent.rawSwapLog.index,
        },
      },
      create: {
        txHash: swapEvent.rawSwapLog.transactionHash,
        tokenAddress: token,
        isBuy: swapEvent.isBuy,
        blockNumber: swapEvent.rawSwapLog.blockNumber,
        jobId,
        index: swapEvent.rawSwapLog.index,
        tokenAmount: tokenAmount.toString(),
        ethAmount: ethAmount.toString(),
        sender: swapEvent.sender,
        recipient: swapEvent.recipient,
        sqrtPriceX96: swapEvent.sqrtPriceX96.toString(),
        liquidity: swapEvent.liquidity.toString(),
        tick: swapEvent.tick,
        amount0: swapEvent.amount0.toString(),
        amount1: swapEvent.amount1.toString(),
      },
      update: {
        jobId,
      },
    })
  }
}

async function prepareForStart(options: StartOptions) {
  const { token, chainId, sellConfig, buyConfig } = options
  const provider = MulticallWrapper.wrap(getProvider(chainId))
  const tokenContract = Erc20__factory.connect(token, provider)

  const wallets = uniqBy([...sellConfig.wallets, ...buyConfig.wallets], 'address')

  const results = await Promise.all([
    ...wallets.map((wallet) => provider.getBalance(wallet.address)),
    ...wallets.map((wallet) => tokenContract.balanceOf(wallet.address)),
  ])
  const ethBalances = results.slice(0, wallets.length)
  const tokenBalances = results.slice(wallets.length)

  const walletStates: Record<string, WalletState> = keyBy(
    wallets.map((wallet, index) => ({
      wallet,
      address: wallet.address,
      ethBalance: ethBalances[index],
      tokenBalance: tokenBalances[index],
      buyable: buyConfig.wallets.includes(wallet),
      sellable: sellConfig.wallets.includes(wallet),
      priority: options.priorityAddresses.includes(wallet.address),
      buyWeight: Math.ceil((Number(buyConfig.totalOrder) / buyConfig.wallets.length) * 1.5),
      sellWeight: Math.ceil((Number(sellConfig.totalOrder) / sellConfig.wallets.length) * 1.5),
    })),
    'address',
  )
  const getBuyWallets = () => Object.values(walletStates).filter((x) => x.buyable)
  const getSellWallets = () => Object.values(walletStates).filter((x) => x.sellable)

  return { walletStates, getBuyWallets, getSellWallets }
}

function getRandomWallet(validWallets: WalletState[]): WalletState {
  const totalWeight = validWallets.reduce((acc, wallet) => acc + wallet.buyWeight, 0)
  const randomWeight = random(0, totalWeight)
  let cumulativeWeight = 0
  for (const wallet of validWallets) {
    cumulativeWeight += wallet.buyWeight
    if (randomWeight <= cumulativeWeight) {
      return wallet
    }
  }
  return validWallets[random(0, validWallets.length - 1)]
}

// function storeSwapEvent
