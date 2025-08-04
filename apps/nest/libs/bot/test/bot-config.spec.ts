import { TestContext, testHelper, UserContextTestType } from '@app/spec/test.helper'
import { INestApplication } from '@nestjs/common'
import { PrismaService } from 'nestjs-prisma'
import { BotToken } from '@prisma/client'
import { ethers } from 'ethers'
import { BotModule } from '@app/bot/bot.module'
import { CreateBotTokenDto } from '@app/bot/dtos/create-bot-token.dto'
import { CreateBotTokenWalletsDto } from '@app/bot/dtos/create-bot-token-wallets.dto'

describe('BotConfigSpec', () => {
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

  describe('CreateBotToken', () => {
    test('CreateBotToken:AddressIsRequired', async () => {
      const res = await uc
        .request((r) => r.post('/bot-config/tokens'))
        .send({
          chainId: '1',
        } as CreateBotTokenDto)
      expect(res).toBeBad(/address should not be empty/)
    })

    test('CreateBotToken:ChainIdIsRequired', async () => {
      const res = await uc
        .request((r) => r.post('/bot-config/tokens'))
        .send({
          address: '0x1234567890123456789012345678901234567890',
        } as CreateBotTokenDto)
      expect(res).toBeBad(/chainId should not be empty/)
    })

    test('CreateBotToken:Success', async () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890'
      const res = await uc
        .request((r) => r.post('/bot-config/tokens'))
        .send({
          address: tokenAddress,
          chainId: '1',
        } as CreateBotTokenDto)
      expect(res).toBeCreated()
      expect(res.body.address).toBe(tokenAddress)
      expect(res.body.chainId).toBe('1')
      expect(res.body.createdAt).toBeDefined()
      expect(res.body.updatedAt).toBeDefined()
    })
  })

  describe('CreateBotTokenWallets', () => {
    let botToken: BotToken

    beforeAll(async () => {
      const tokenAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      const res = await uc
        .request((r) => r.post('/bot-config/tokens'))
        .send({
          address: tokenAddress,
          chainId: '1',
        } as CreateBotTokenDto)
      botToken = res.body
    })

    test('CreateBotTokenWallets:TokenAddressIsRequired', async () => {
      const wallet = ethers.Wallet.createRandom()
      const res = await uc
        .request((r) => r.post('/bot-config/token-wallets'))
        .send({
          wallets: [
            {
              privateKey: wallet.privateKey,
              buyable: true,
              sellable: false,
            },
          ],
        } as CreateBotTokenWalletsDto)
      expect(res).toBeBad(/tokenAddress should not be empty/)
    })

    test('CreateBotTokenWallets:WalletsArrayIsRequired', async () => {
      const res = await uc
        .request((r) => r.post('/bot-config/token-wallets'))
        .send({
          tokenAddress: botToken.address,
        } as CreateBotTokenWalletsDto)
      expect(res).toBeBad(/wallets must be an array/)
    })

    test('CreateBotTokenWallets:PrivateKeyIsRequired', async () => {
      const res = await uc
        .request((r) => r.post('/bot-config/token-wallets'))
        .send({
          tokenAddress: botToken.address,
          wallets: [
            {
              buyable: true,
              sellable: false,
            },
          ],
        } as CreateBotTokenWalletsDto)
      expect(res).toBeBad(/privateKey should not be empty/)
    })

    test('CreateBotTokenWallets:BuyableIsRequired', async () => {
      const wallet = ethers.Wallet.createRandom()
      const res = await uc
        .request((r) => r.post('/bot-config/token-wallets'))
        .send({
          tokenAddress: botToken.address,
          wallets: [
            {
              privateKey: wallet.privateKey,
              sellable: false,
            },
          ],
        } as CreateBotTokenWalletsDto)
      expect(res).toBeBad(/buyable must be a boolean value/)
    })

    test('CreateBotTokenWallets:SellableIsRequired', async () => {
      const wallet = ethers.Wallet.createRandom()
      const res = await uc
        .request((r) => r.post('/bot-config/token-wallets'))
        .send({
          tokenAddress: botToken.address,
          wallets: [
            {
              privateKey: wallet.privateKey,
              buyable: true,
            },
          ],
        } as CreateBotTokenWalletsDto)
      expect(res).toBeBad(/sellable must be a boolean value/)
    })

    test('CreateBotTokenWallets:TokenNotFound', async () => {
      const wallet = ethers.Wallet.createRandom()
      const res = await uc
        .request((r) => r.post('/bot-config/token-wallets'))
        .send({
          tokenAddress: '0xnonexistenttoken0000000000000000000000000',
          wallets: [
            {
              privateKey: wallet.privateKey,
              buyable: true,
              sellable: false,
            },
          ],
        } as CreateBotTokenWalletsDto)
      expect(res).toBe404()
    })

    test('CreateBotTokenWallets:Success', async () => {
      const wallet1 = ethers.Wallet.createRandom()
      const wallet2 = ethers.Wallet.createRandom()

      const res = await uc
        .request((r) => r.post('/bot-config/token-wallets'))
        .send({
          tokenAddress: botToken.address,
          wallets: [
            {
              privateKey: wallet1.privateKey,
              buyable: true,
              sellable: false,
            },
            {
              privateKey: wallet2.privateKey,
              buyable: false,
              sellable: true,
            },
          ],
        } as CreateBotTokenWalletsDto)

      expect(res).toBeCreated()
      expect(res.body).toHaveLength(2)

      // Check first wallet
      expect(res.body[0].walletAddress).toBe(wallet1.address)
      expect(res.body[0].tokenAddress).toBe(botToken.address)
      expect(res.body[0].buyable).toBe(true)
      expect(res.body[0].sellable).toBe(false)
      expect(res.body[0].wallet).toBeDefined()
      expect(res.body[0].wallet.address).toBe(wallet1.address)
      expect(res.body[0].wallet.privateKey).toBe(wallet1.privateKey)
      expect(res.body[0].token).toBeDefined()
      expect(res.body[0].token.address).toBe(botToken.address)

      // Check second wallet
      expect(res.body[1].walletAddress).toBe(wallet2.address)
      expect(res.body[1].tokenAddress).toBe(botToken.address)
      expect(res.body[1].buyable).toBe(false)
      expect(res.body[1].sellable).toBe(true)
      expect(res.body[1].wallet).toBeDefined()
      expect(res.body[1].wallet.address).toBe(wallet2.address)
      expect(res.body[1].wallet.privateKey).toBe(wallet2.privateKey)
      expect(res.body[1].token).toBeDefined()
      expect(res.body[1].token.address).toBe(botToken.address)
    })

    test('CreateBotTokenWallets:UpdateExistingWallet', async () => {
      const wallet = ethers.Wallet.createRandom()

      // Create initial wallet configuration
      const res1 = await uc
        .request((r) => r.post('/bot-config/token-wallets'))
        .send({
          tokenAddress: botToken.address,
          wallets: [
            {
              privateKey: wallet.privateKey,
              buyable: true,
              sellable: false,
            },
          ],
        } as CreateBotTokenWalletsDto)

      expect(res1).toBeCreated()
      expect(res1.body[0].buyable).toBe(true)
      expect(res1.body[0].sellable).toBe(false)

      // Update the same wallet with different configuration
      const res2 = await uc
        .request((r) => r.post('/bot-config/token-wallets'))
        .send({
          tokenAddress: botToken.address,
          wallets: [
            {
              privateKey: wallet.privateKey,
              buyable: false,
              sellable: true,
            },
          ],
        } as CreateBotTokenWalletsDto)

      expect(res2).toBeCreated()
      expect(res2.body[0].walletAddress).toBe(wallet.address)
      expect(res2.body[0].buyable).toBe(false)
      expect(res2.body[0].sellable).toBe(true)
    })
  })
})
