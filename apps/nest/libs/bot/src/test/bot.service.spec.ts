import { Test, TestingModule } from '@nestjs/testing'
import { BotService } from '../services/bot.service'
import { ethers, parseEther } from 'ethers'
import { ChainConfigs, getProvider } from '../config'
import { getContractCreation } from '../helpers/ethers-scan.helper'
import { swapLib } from '../libs/swap.lib'
import { random } from 'lodash'
import { Duration } from 'luxon'
import { Erc20__factory } from '../contracts'
import { TestContext, testHelper } from '@app/spec'
import { BotModule } from '../bot.module'

const pk = process.env.PK
const pkBuys = process.env.PK_BUYS.split(',')
const pkSells = process.env.PK_SELLS.split(',')

describe('BotService', () => {
  jest.setTimeout(1000000)
  const swaplib = swapLib
  let tc: TestContext
  let service: BotService
  const chainId = '11124'
  const provider = getProvider(chainId)

  beforeEach(async () => {
    tc = await testHelper.createContext({
      imports: [BotModule],
    })
    service = tc.app.get(BotService)
  })

  it('get eth price', async () => {
    await swaplib.getEthPrice()
  })
  it.skip('create LP', async () => {
    const chainId = '11124' // testnet
    const account = new ethers.Wallet(pk, getProvider(chainId))

    await swaplib.createPool({
      runner: account,
      token: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
      tokenAmount: ethers.parseUnits('1000000', 18),
      ethAmount: ethers.parseUnits('0.1', 18),
      chainId,
      fee: 500,
      tickSpacing: 10,
      caller: account.address,
    })
  })
  it.skip('buy', async () => {
    const chainId = '11124' // testnet
    const account = new ethers.Wallet(pk, getProvider(chainId))
    try {
      const tokenAmount = await swaplib.buy({
        runner: account,
        token: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
        ethAmount: ethers.parseUnits('0.001', 18),
        chainId,
        fee: 500,
      })
      console.log('tokenAmount', tokenAmount)
    } catch (error) {
      console.log('error', error.message)
    }
  })
  it('sell', async () => {
    const chainId = '11124' // testnet
    const account = new ethers.Wallet(pk, getProvider(chainId))
    const ethAmount = await swaplib.sellExactToken({
      runner: account,
      token: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
      tokenAmount: ethers.parseUnits('1000', 18),
      chainId,
      fee: 500,
    })
    console.log('ethAmount', ethAmount)
  })
  it('sell exact eth', async () => {
    const chainId = '11124' // testnet
    const account = new ethers.Wallet(pk, getProvider(chainId))
    const tokenAmount = await swaplib.sellExactEth({
      runner: account,
      token: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
      ethOut: ethers.parseUnits('0.0001', 18),
      chainId,
      fee: 500,
    })
    console.log('tokenAmount', tokenAmount)
  })
  it('token price', async () => {
    const price = await swaplib.getTokenPrice({
      token: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
      chainId: '11124',
      fee: 500,
    })
    console.log('price', price.toString())
  })
  it('quote exact eth output', async () => {
    const tokenIn = await swaplib.quoteExactEthOutput({
      token: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
      ethOut: ethers.parseUnits('0.001', 18),
      chainId: '11124',
      fee: 500,
    })
    console.log('tokenIn', tokenIn.toString())
  })
  it('scan swap', async () => {
    await swaplib.scanSwap({
      token: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
      chainId: '11124',
      fee: 500,
      fromBlock: 1,
    })
  })
  it('getContractCreation', async () => {
    const res = await getContractCreation({
      address: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
      chainId: '11124',
    })
    console.log('res', res)
  })
  it('random 01', () => {
    for (let i = 0; i < 100; i++) {
      const res = random(1, 2)
      console.log('res', res)
    }
  })
  it('generate wallets', async () => {
    for (let i = 0; i < 10; i++) {
      const wallet = ethers.Wallet.createRandom()
      console.log('wallet', wallet.privateKey)
    }
  })
  it('fund eth', async () => {
    const chainId = '11124' // testnet
    const mainWallet = new ethers.Wallet(pk, getProvider(chainId))
    const provider = getProvider(chainId)
    const tokenContract = Erc20__factory.connect('0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078', provider)
    let nonce = await provider.getTransactionCount(mainWallet.address)
    console.log('start fund eth')
    await Promise.all(
      [...pkBuys, ...pkSells].map(async (pk) => {
        const wallet = new ethers.Wallet(pk, provider)
        return mainWallet.sendTransaction({
          to: wallet.address,
          value: ethers.parseUnits(pkBuys.includes(pk) ? '0.01' : '0.001', 18),
          nonce: nonce++,
        })
      }),
    )
    console.log('start fund token')
    await Promise.all(
      pkSells.map(async (pk) => {
        const wallet = new ethers.Wallet(pk, provider)
        return tokenContract
          .connect(mainWallet)
          .transfer(wallet.address, ethers.parseUnits('1000000', 18), { nonce: nonce++ })
      }),
    )
  })
  it('start', async () => {
    const chainId = '11124'
    const provider = getProvider(chainId)
    const buyWallets = pkBuys.map((pk) => new ethers.Wallet(pk, provider))
    const sellWallets = pkSells.map((pk) => new ethers.Wallet(pk, provider))
    await service.start({
      token: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
      chainId: '11124',
      fee: 500,
      sellConfig: {
        wallets: [...sellWallets, ...buyWallets],
        volume: parseEther('0.0001'),
        totalOrder: 10n,
        delay: Duration.fromObject({ seconds: 10 }),
      },
      buyConfig: {
        wallets: [...buyWallets, ...sellWallets],
        volume: parseEther('0.001'),
        totalOrder: 10n,
      },
      priorityAddresses: [],
      duration: Duration.fromObject({ seconds: 100 }),
    })
  })
  it('exact swap event', async () => {
    const tx = await provider.getTransactionReceipt(
      '0x118847ec2a65f2286c85b42e0eb9ce04770003f0360207ee0a245f275aeb024a',
    )
    const result = swaplib.exactSwapEvent({
      swapTx: tx,
      token: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
      chainId: '11124',
    })
    console.log('result', result)
  })
})
