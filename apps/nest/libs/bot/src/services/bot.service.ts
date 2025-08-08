import { Injectable, BadRequestException, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common'
import { DateTime, Duration } from 'luxon'
import { ethers, formatUnits } from 'ethers'
import { get, keyBy, maxBy, omit, pick, random, set, unionBy, uniq, uniqBy } from 'lodash'
import { MulticallWrapper } from 'ethers-multicall-provider'
import { ChainConfigs, getProvider } from '../config'
import { Erc20__factory } from '../contracts'
import { proH } from '@app/helper'
import { parsedSwapEventToDb, ParsedSwapEventType, swapLib } from '../libs/swap.lib'
import { logl } from '@app/helper/log.helper'
import { PrismaService } from 'nestjs-prisma'
import randomstring from 'randomstring'
import { StartBotDto } from '../dtos/start-bot.dto'
import { Observable, Subscriber } from 'rxjs'
import { TokenSwap } from '@prisma/client'
import { fnHelper } from '@app/helper/fn.helper'
import { th } from '@app/helper/transform.helper'
import { TokenSwapEntity } from '../entities/token-swap.entity'
import { QueryTokenSwapDto } from '../dtos/query-token-swap.dto'

interface WalletState {
  wallet: ethers.Wallet
  address: string
  ethBalance: bigint
  tokenBalance: bigint
  buyable: boolean
  sellable: boolean
  // priority: boolean
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
  duration: Duration
}

export interface CustomMessageEvent {
  data: {
    jobId?: string
    message?: string
    swap?: any
    state?: {
      remainSellOrder: number
      remainBuyOrder: number
      remainSellVolume: number
      remainBuyVolume: number
      nextBuyAt: string
      nextSellAt: string
    }
  }
}

@Injectable()
export class BotService implements OnApplicationShutdown {
  jobTasks: {
    [tokenAddress: string]: {
      jobId?: string
      task?: Promise<void>
      status?: 'idle' | 'running' | 'stopped'
      subscribers?: Subscriber<CustomMessageEvent>[]
    }
  } = {}
  shutdown = false

  constructor(private readonly prisma: PrismaService) {}

  onApplicationShutdown() {
    logl('BotService is shutting down')
    this.shutdown = true
  }

  async stopTokenJob(token: string) {
    const jobId = get(this.jobTasks, [token, 'jobId'])
    if (jobId) {
      logl(`${token} job[${jobId}] is interrupted`)
      set(this.jobTasks, [token, 'jobId'], undefined)
    } else {
      logl(`${token} job is not running`)
    }
  }

  reconnectBot(tokenAddress: string) {
    const jobTask = get(this.jobTasks, [tokenAddress])
    if (jobTask?.status !== 'running') {
      throw new BadRequestException('Bot is not running')
    }
    return new Observable<CustomMessageEvent>((subscriber: Subscriber<CustomMessageEvent>) => {
      jobTask.subscribers?.push(subscriber)
    })
  }

  startBot(tokenAddress: string, dto: StartBotDto) {
    let jobTask = get(this.jobTasks, [tokenAddress])
    if (jobTask?.status === 'running') {
      throw new BadRequestException('Bot is already running')
    }
    jobTask = { task: this.processStream(tokenAddress, dto), status: 'idle', subscribers: [] }
    jobTask.task
      .then(() => {
        jobTask.subscribers?.forEach((subscriber) => {
          subscriber.complete()
        })
      })
      .catch((error) => {
        jobTask.subscribers?.forEach((subscriber) => {
          subscriber.error(error)
        })
      })
      .finally(() => {
        jobTask.status = 'stopped'
      })
    set(this.jobTasks, [tokenAddress], jobTask)
    return new Observable<CustomMessageEvent>((subscriber: Subscriber<CustomMessageEvent>) => {
      jobTask.status = 'running'
      jobTask.subscribers.push(subscriber)
    })
  }

  async processStream(tokenAddress: string, dto: StartBotDto) {
    const token = await this.prisma.botToken.findUnique({
      where: {
        address: tokenAddress,
      },
    })
    console.log('startBot.token', tokenAddress, dto)
    if (!token) {
      throw new BadRequestException('Token not found')
    }
    const tokenWallets = await this.prisma.botTokenWallet.findMany({
      where: {
        tokenAddress,
      },
      include: {
        wallet: true,
      },
      take: 1000,
    })

    if (tokenWallets.length === 0) {
      throw new BadRequestException('No wallets found for this token')
    }

    const provider = getProvider(token.chainId)

    // Transform to StartOptions
    const buyWallets = tokenWallets
      .filter((tw) => tw.buyable)
      .map((tw) => new ethers.Wallet(tw.wallet.privateKey, provider))

    const sellWallets = tokenWallets
      .filter((tw) => tw.sellable)
      .map((tw) => new ethers.Wallet(tw.wallet.privateKey, provider))

    if (buyWallets.length === 0 && sellWallets.length === 0) {
      throw new BadRequestException('No buyable or sellable wallets found for this token')
    }

    const startOptions: StartOptions = {
      token: tokenAddress,
      chainId: token.chainId,
      fee: token.fee,
      sellConfig: {
        wallets: sellWallets,
        volume: BigInt(dto.sellVolume),
        totalOrder: BigInt(dto.sellOrder),
        delay: Duration.fromObject({ minutes: dto.sellDelay }),
      },
      buyConfig: {
        wallets: buyWallets,
        volume: BigInt(dto.buyVolume),
        totalOrder: BigInt(dto.buyOrder),
      },
      duration: Duration.fromObject({ minutes: dto.duration }),
    }

    // Call start function
    await this.start(
      startOptions,
      ({ jobId, message }) => {
        logl(message)
        get(this.jobTasks, [tokenAddress])?.subscribers?.forEach((subscriber) => {
          subscriber.next({
            data: { jobId, message },
          })
        })
      },
      ({ swap, state, jobId }) => {
        get(this.jobTasks, [tokenAddress])?.subscribers?.forEach((subscriber) => {
          subscriber.next({
            data: { swap, state, jobId },
          })
        })
      },
    )
  }

  async start(
    options: StartOptions,
    onLog?: ({ jobId, message }: { jobId: string; message: string }) => void,
    onData?: (data: CustomMessageEvent['data']) => void,
  ) {
    const jobId = randomstring.generate(7)
    const { token, chainId, sellConfig, buyConfig, duration, fee } = options
    const { getBuyWallets, getSellWallets } = await prepareForStart(options)
    let log = logl
    if (onLog) {
      log = (message) => onLog({ jobId, message })
    }

    const startTime = DateTime.now()
    const endTime = startTime.plus(duration)
    let nextBuyAt = DateTime.now()
    let nextSellAt = DateTime.now().plus(sellConfig.delay || { minute: 10 })

    set(this.jobTasks, [options.token, 'jobId'], jobId)
    log(
      `[${jobId}] start job:
token: ${options.token}
buyWallets: ${buyConfig.wallets.length}
sellWallets: ${sellConfig.wallets.length}
sellVolume: ${formatUnits(sellConfig.volume, 18)}
sellOrder: ${sellConfig.totalOrder}
buyVolume: ${formatUnits(buyConfig.volume, 18)}
buyOrder: ${buyConfig.totalOrder}
`,
    )
    while (DateTime.now() < endTime && (buyConfig.totalOrder > 0 || sellConfig.totalOrder > 0)) {
      if (this.shutdown) {
        log(`[${jobId}] Bot stopped by shutdown`)
        break
      }
      if (get(this.jobTasks, [options.token, 'jobId']) !== jobId) {
        log(`[${jobId}] Bot stopped by another job`)
        break
      }
      onData?.({
        jobId,
        state: {
          remainSellOrder: Number(sellConfig.totalOrder),
          remainBuyOrder: Number(buyConfig.totalOrder),
          remainSellVolume: fnHelper.fromDecimals(sellConfig.volume, 18).toUnsafeFloat(),
          remainBuyVolume: fnHelper.fromDecimals(buyConfig.volume, 18).toUnsafeFloat(),
          nextBuyAt: nextBuyAt.toISO(),
          nextSellAt: nextSellAt.toISO(),
        },
      })
      // logl(
      //   `[${jobId}] sellVolume: ${formatUnits(sellConfig.volume, 18)}, sellOrder: ${sellConfig.totalOrder}, buyVolume: ${formatUnits(buyConfig.volume, 18)}, buyOrder: ${buyConfig.totalOrder}`,
      // )
      if (buyConfig.totalOrder > 0 && nextBuyAt <= DateTime.now()) {
        let ethAmount = buyConfig.volume / buyConfig.totalOrder
        if (buyConfig.totalOrder > 1n) {
          ethAmount = (ethAmount * BigInt(random(5, 195))) / 100n
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
            log(
              `[${jobId}][Buy-${buyConfig.totalOrder}][${randomWallet.wallet.address}] Buy with ${formatUnits(ethAmount, 18)} eth`,
            )
            const swapEvent = await swapLib.buy({
              runner: randomWallet.wallet,
              token,
              ethAmount,
              chainId,
              fee,
            })
            log(
              `[${jobId}][Buy-${buyConfig.totalOrder}][${randomWallet.wallet.address}] Buy success with ${formatUnits(ethAmount, 18)} eth`,
            )
            randomWallet.ethBalance -= swapEvent.ethAmount
            randomWallet.tokenBalance += swapEvent.tokenAmount
            buyConfig.totalOrder -= 1n
            buyConfig.volume -= ethAmount

            const swap = await this.storeSwapEvent({ swapEvent, token, chainId, jobId })
            const currentTime = DateTime.now()
            if (currentTime < endTime && buyConfig.totalOrder > 0) {
              const remain = endTime.diff(currentTime).as('seconds')
              let waitDuration = buyConfig.totalOrder > 1n ? remain / Number(buyConfig.totalOrder) : remain
              waitDuration = Math.ceil((waitDuration * (buyConfig.totalOrder > 1n ? random(5, 195) : 100)) / 100)
              nextBuyAt = currentTime.plus({ seconds: waitDuration })
              log(
                `[${jobId}][Buy-${buyConfig.totalOrder}] prepare next buy after ${waitDuration} seconds at ${nextBuyAt.toISO()}`,
              )
            }
            onData?.({
              jobId,
              swap,
              state: {
                remainSellOrder: Number(sellConfig.totalOrder),
                remainBuyOrder: Number(buyConfig.totalOrder),
                remainSellVolume: fnHelper.fromDecimals(sellConfig.volume, 18).toUnsafeFloat(),
                remainBuyVolume: fnHelper.fromDecimals(buyConfig.volume, 18).toUnsafeFloat(),
                nextBuyAt: nextBuyAt.toISO(),
                nextSellAt: nextSellAt.toISO(),
              },
            })
          } catch (error) {
            log(`[${jobId}][Buy-${buyConfig.totalOrder}] Buy error` + error.message)
          }
        } else {
          log(`[${jobId}][Buy-${buyConfig.totalOrder}] No valid wallets to buy with ${formatUnits(ethAmount, 18)} eth`)
        }
      }
      await proH.delay(1000)
      if (sellConfig.totalOrder > 0 && nextSellAt < DateTime.now()) {
        let ethVol = sellConfig.volume / sellConfig.totalOrder
        if (sellConfig.totalOrder > 1n) {
          ethVol = (ethVol * BigInt(random(5, 195))) / 100n
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
              log(
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
              log(
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
            log(
              `[${jobId}][Sell-${sellConfig.totalOrder}][${randomWallet.wallet.address}] Sell success ${formatUnits(swapEvent.tokenAmount, 18)} token to ${formatUnits(swapEvent.ethAmount, 18)} eth`,
            )
            randomWallet.ethBalance += swapEvent.ethAmount
            randomWallet.tokenBalance -= swapEvent.tokenAmount
            sellConfig.totalOrder -= 1n
            sellConfig.volume += swapEvent.ethAmount

            const currentTime = DateTime.now()
            if (currentTime < endTime && sellConfig.totalOrder > 0) {
              const remain = endTime.diff(currentTime).as('seconds')
              let waitDuration = sellConfig.totalOrder > 1n ? remain / Number(sellConfig.totalOrder) : remain
              waitDuration = Math.ceil((waitDuration * (sellConfig.totalOrder > 1n ? random(5, 195) : 100)) / 100)
              nextSellAt = currentTime.plus({ seconds: waitDuration })
              log(
                `[${jobId}][Sell-${sellConfig.totalOrder}] prepare next sell after ${waitDuration} seconds at ${nextSellAt.toISO()}`,
              )
            }

            const swap = await this.storeSwapEvent({ swapEvent, token, chainId, jobId })
            onData?.({
              jobId,
              swap,
              state: {
                remainSellOrder: Number(sellConfig.totalOrder),
                remainBuyOrder: Number(buyConfig.totalOrder),
                remainSellVolume: fnHelper.fromDecimals(sellConfig.volume, 18).toUnsafeFloat(),
                remainBuyVolume: fnHelper.fromDecimals(buyConfig.volume, 18).toUnsafeFloat(),
                nextBuyAt: nextBuyAt.toISO(),
                nextSellAt: nextSellAt.toISO(),
              },
            })
          } catch (error) {
            log(`[${jobId}][Sell-${sellConfig.totalOrder}] Sell error` + error.message)
          }
        }
      }
      await proH.delay(1000)
    }
    set(this.jobTasks, [options.token, 'jobId'], undefined)
    const diff = DateTime.now().diff(startTime).as('seconds')
    log(`[${jobId}] Bot stopped in ${diff} seconds`)
  }

  private async storeSwapEvent(options: {
    swapEvent: ParsedSwapEventType
    token: string
    chainId: string
    jobId?: string
  }) {
    const { swapEvent, token, chainId, jobId } = options

    const swap = await this.prisma.tokenSwap.upsert({
      where: {
        txHash_index: {
          txHash: swapEvent.rawSwapLog.transactionHash,
          index: swapEvent.rawSwapLog.transactionIndex,
        },
      },
      create: parsedSwapEventToDb({ swapEvent, token, chainId, jobId }),
      update: {
        jobId,
      },
    })
    const x = {
      txHash: swap.txHash,
      index: swap.index,
      jobId: swap.jobId,
      isBuy: swap.isBuy,
      tokenAddress: swap.tokenAddress,
      blockNumber: swap.blockNumber,
      tokenAmount: fnHelper.decimal2BigInt(swap.tokenAmount).toString(),
      ethAmount: fnHelper.decimal2BigInt(swap.ethAmount).toString(),
      sender: swap.sender,
      recipient: swap.recipient,
      amount0: fnHelper.decimal2BigInt(swap.amount0).toString(),
      amount1: fnHelper.decimal2BigInt(swap.amount1).toString(),
      sqrtPriceX96: swap.sqrtPriceX96.toString(),
      liquidity: fnHelper.decimal2BigInt(swap.liquidity).toString(),
    }
    // console.log('storeSwapEvent', x)
    return x
  }

  async getSwaps(tokenAddress: string, queryTokenSwapDto: QueryTokenSwapDto): Promise<TokenSwapEntity[]> {
    const { select, include, where, sort, take, skip } = queryTokenSwapDto

    const swaps = await this.prisma.tokenSwap.findMany({
      where: {
        tokenAddress,
        ...where,
      },
      orderBy: sort || { blockNumber: 'desc' },
      take,
      skip,
      ...(select
        ? { select: Object.fromEntries(select.map((key) => [key, true])) }
        : include
          ? { include: Object.fromEntries(include.map((key) => [key, true])) }
          : {}),
    })

    return th.toInstancesSafe(TokenSwapEntity, swaps)
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
      // priority: options.priorityAddresses.includes(wallet.address),
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
