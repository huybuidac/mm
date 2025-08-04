import { Injectable } from '@nestjs/common'
import { BotService } from './bot.service'
import { DateTime, Duration } from 'luxon'
import { ethers } from 'ethers'
import { keyBy, maxBy, random, set, unionBy, uniq, uniqBy } from 'lodash'
import { MulticallWrapper } from 'ethers-multicall-provider'
import { getProvider } from './config'
import { Erc20__factory } from './contracts'
import { proH } from '@app/helper'

@Injectable()
export class ScheduleService {
  starteds = {}

  constructor(private readonly botService: BotService) {}

  async start(options: {
    token: string
    chainId: string
    sellConfig: {
      wallets: ethers.Wallet[]
      volume: bigint
      totalOrder: bigint
    }
    buyConfig: {
      wallets: ethers.Wallet[]
      volume: bigint
      totalOrder: bigint
    }
    duration: Duration
  }) {
    const provider = MulticallWrapper.wrap(getProvider(options.chainId))

    set(this.starteds, [options.token, options.chainId], true)
    const { token, chainId, sellConfig, buyConfig, duration } = options

    const tokenContract = Erc20__factory.connect(token, provider)

    const wallets = uniqBy([...sellConfig.wallets, ...buyConfig.wallets], 'address')

    const results = await Promise.all([
      ...wallets.map((wallet) => provider.getBalance(wallet.address)),
      ...wallets.map((wallet) => tokenContract.balanceOf(wallet.address)),
    ])
    const ethBalances = results.slice(0, wallets.length)
    const tokenBalances = results.slice(wallets.length)

    const walletsState = keyBy(
      wallets.map((wallet, index) => ({
        address: wallet.address,
        ethBalance: ethBalances[index],
        tokenBalance: tokenBalances[index],
      })),
      'address',
    )
    const getWallets = () => Object.values(walletsState)

    const nextBuyAt = DateTime.now()
    const nextSellAt = DateTime.now().plus({ minute: 10 })

    while (buyConfig.totalOrder > 0 || sellConfig.totalOrder > 0) {
      const walletMaxEthBalance = maxBy(Object.values(walletsState), (w) => w.ethBalance)
      const walletMaxTokenBalance = maxBy(Object.values(walletsState), (w) => w.tokenBalance)

      if (nextBuyAt < DateTime.now()) {
        let ethAmount = buyConfig.volume / buyConfig.totalOrder
        ethAmount = (ethAmount * BigInt(random(20, 180))) / 100n
        const validWallets = getWallets().filter((x) => x.ethBalance > ethAmount)
        if (validWallets.length > 0) {
          const randomWallet = validWallets[random(0, validWallets.length - 1)]
          // const res = await this.botService.
        }
      }
      await proH.delay(5000) // 10s
      if (nextSellAt < DateTime.now()) {
        //
      }
      await proH.delay(5000) // 10s
    }
  }
}
