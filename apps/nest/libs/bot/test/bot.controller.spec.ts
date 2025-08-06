import { TestContext, testHelper, UserContextTestType } from '@app/spec/test.helper'
import { INestApplication } from '@nestjs/common'
import { PrismaService } from 'nestjs-prisma'
import { BotModule } from '../src/bot.module'
import { StartBotDto } from '../src/dtos/start-bot.dto'

describe('BotControllerSpec', () => {
  let tc: TestContext
  let app: INestApplication
  let prismaService: PrismaService
  let uc: UserContextTestType

  beforeAll(async () => {
    tc = await testHelper.createContext({
      imports: [BotModule],
    })
    app = tc.app
    prismaService = app.get(PrismaService)
    uc = await tc.generateAcount()
  })

  afterAll(async () => await tc?.clean())

  describe('StartBot', () => {
    test('StartBot:NoWalletsFound', async () => {
      const res = await uc.request((r) => r.post('/bot/start')).send({
        token: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        fee: 3000,
        sellVolume: '1000000000000000000',
        sellOrder: '5',
        buyVolume: '1000000000000000000',
        buyOrder: '5',
        sellDelay: 10,
        duration: 60,
      } as StartBotDto)
      expect(res).toBeBad(/No wallets found for this token/)
    })

    test('StartBot:Success', async () => {
      // First create a bot token and wallet
      await prismaService.botToken.create({
        data: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
        },
      })

      await prismaService.botWallet.create({
        data: {
          address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
        },
      })

      await prismaService.botTokenWallet.create({
        data: {
          walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          tokenAddress: '0x1234567890123456789012345678901234567890',
          buyable: true,
          sellable: true,
        },
      })

      const res = await uc.request((r) => r.post('/bot/start')).send({
        token: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        fee: 3000,
        sellVolume: '1000000000000000000',
        sellOrder: '5',
        buyVolume: '1000000000000000000',
        buyOrder: '5',
        sellDelay: 10,
        duration: 60,
      } as StartBotDto)
      expect(res).toBeCreated()
      expect(res.body.message).toBe('Bot started successfully')
    })
  })

  describe('GetSwaps', () => {
    test('GetSwaps:Success', async () => {
      // First create a bot token
      await prismaService.botToken.create({
        data: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
        },
      })

      // Create some test swaps
      await prismaService.tokenSwap.createMany({
        data: [
          {
            txHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
            index: 0,
            jobId: 'test-job-1',
            isBuy: true,
            tokenAddress: '0x1234567890123456789012345678901234567890',
            blockNumber: 1000,
            tokenAmount: '1000000000000000000',
            ethAmount: '100000000000000000',
            sender: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            recipient: '0x1234567890123456789012345678901234567890',
            amount0: '1000000000000000000',
            amount1: '100000000000000000',
            sqrtPriceX96: '1000000000000000000',
            liquidity: '1000000000000000000',
            tick: 1000,
          },
          {
            txHash: '0x2345678901234567890123456789012345678901234567890123456789012345',
            index: 0,
            jobId: 'test-job-2',
            isBuy: false,
            tokenAddress: '0x1234567890123456789012345678901234567890',
            blockNumber: 1001,
            tokenAmount: '500000000000000000',
            ethAmount: '50000000000000000',
            sender: '0x1234567890123456789012345678901234567890',
            recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            amount0: '500000000000000000',
            amount1: '50000000000000000',
            sqrtPriceX96: '1000000000000000000',
            liquidity: '1000000000000000000',
            tick: 1001,
          },
        ],
      })

      const res = await uc.request((r) => r.get('/bot/0x1234567890123456789012345678901234567890/swaps'))
      
      expect(res).toBeOK()
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(2)
      expect(res.body[0].txHash).toBe('0x2345678901234567890123456789012345678901234567890123456789012345') // Should be ordered by blockNumber desc
      expect(res.body[0].isBuy).toBe(false)
      expect(res.body[1].isBuy).toBe(true)
    })

    test('GetSwaps:WithQueryFilters', async () => {
      // First create a bot token
      await prismaService.botToken.create({
        data: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
        },
      })

      // Create some test swaps
      await prismaService.tokenSwap.createMany({
        data: [
          {
            txHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
            index: 0,
            jobId: 'test-job-1',
            isBuy: true,
            tokenAddress: '0x1234567890123456789012345678901234567890',
            blockNumber: 1000,
            tokenAmount: '1000000000000000000',
            ethAmount: '100000000000000000',
            sender: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            recipient: '0x1234567890123456789012345678901234567890',
            amount0: '1000000000000000000',
            amount1: '100000000000000000',
            sqrtPriceX96: '1000000000000000000',
            liquidity: '1000000000000000000',
            tick: 1000,
          },
          {
            txHash: '0x2345678901234567890123456789012345678901234567890123456789012345',
            index: 0,
            jobId: 'test-job-2',
            isBuy: false,
            tokenAddress: '0x1234567890123456789012345678901234567890',
            blockNumber: 1001,
            tokenAmount: '500000000000000000',
            ethAmount: '50000000000000000',
            sender: '0x1234567890123456789012345678901234567890',
            recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            amount0: '500000000000000000',
            amount1: '50000000000000000',
            sqrtPriceX96: '1000000000000000000',
            liquidity: '1000000000000000000',
            tick: 1001,
          },
        ],
      })

      // Test with query filters
      const res = await uc.request((r) => r.get('/bot/0x1234567890123456789012345678901234567890/swaps?where[isBuy]=true&take=1'))
      
      expect(res).toBeOK()
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(1)
      expect(res.body[0].isBuy).toBe(true)
    })

    test('GetSwaps:NoSwaps', async () => {
      const res = await uc.request((r) => r.get('/bot/0x9999999999999999999999999999999999999999/swaps'))
      
      expect(res).toBeOK()
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(0)
    })
  })
}) 