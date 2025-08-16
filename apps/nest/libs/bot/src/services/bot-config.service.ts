import { Injectable } from '@nestjs/common'
import { ethers } from 'ethers'
import { th } from '@app/helper/transform.helper'
import { CreateBotTokenDto } from '../dtos/create-bot-token.dto'
import { CreateBotTokenWalletsDto } from '../dtos/create-bot-token-wallets.dto'
import { BotTokenEntity } from '../entities/bot-token.entity'
import { BotTokenWalletEntity } from '../entities/bot-token-wallet.entity'
import { PrismaService } from 'nestjs-prisma'
import { keyBy, uniqBy } from 'lodash'

@Injectable()
export class BotConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getToken(address: string) {
    const token = await this.prisma.botToken.findUniqueOrThrow({
      where: { address },
    })
    return th.toInstanceSafe(BotTokenEntity, token)
  }

  async getAllTokens() {
    const tokens = await this.prisma.botToken.findMany()
    return th.toInstancesSafe(BotTokenEntity, tokens)
  }

  async toggleTokenEnabled(address: string) {
    const token = await this.prisma.botToken.findUniqueOrThrow({
      where: { address },
    })
    const updatedToken = await this.prisma.botToken.update({
      where: { address },
      data: {
        enabled: !token.enabled,
      },
    })
    return th.toInstanceSafe(BotTokenEntity, updatedToken)
  }

  async createBotToken(dto: CreateBotTokenDto): Promise<BotTokenEntity> {
    const botToken = await this.prisma.botToken.create({
      data: {
        address: dto.address,
        chainId: dto.chainId,
        fee: dto.fee,
      },
    })
    return th.toInstanceSafe(BotTokenEntity, botToken)
  }

  async createBotTokenWallets(dto: CreateBotTokenWalletsDto): Promise<BotTokenWalletEntity[]> {
    const oldWallets = await this.prisma.botTokenWallet.findMany({
      where: { tokenAddress: dto.tokenAddress },
      include: {
        wallet: true,
      },
      take: 1000,
    })
    const oldWalletsMap = keyBy(oldWallets, 'walletAddress')
    await this.prisma.botToken.findUniqueOrThrow({
      where: { address: dto.tokenAddress },
    })

    const wallets = dto.wallets.map((wallet) => {
      const privateKey = wallet.privateKey || oldWalletsMap[wallet.address]?.wallet.privateKey
      return {
        ...wallet,
        privateKey,
        address: new ethers.Wallet(privateKey).address,
      }
    })

    const results = await this.prisma.$transaction(async (tx) => {
      await tx.botTokenWallet.deleteMany({
        where: { tokenAddress: dto.tokenAddress },
      })
      await tx.botWallet.createMany({
        data: wallets.map((wallet) => ({
          address: wallet.address,
          privateKey: wallet.privateKey,
        })),
        skipDuplicates: true,
      })
      return await tx.botTokenWallet.createManyAndReturn({
        data: wallets.map((wallet) => ({
          walletAddress: wallet.address,
          tokenAddress: dto.tokenAddress,
          buyable: wallet.buyable,
          sellable: wallet.sellable,
        })),
      })
    })

    return th.toInstancesSafe(BotTokenWalletEntity, results)
  }

  async getAllTokenWallets(address: string) {
    const wallets = await this.prisma.botTokenWallet.findMany({
      where: { tokenAddress: address },
      take: 1000,
    })
    return th.toInstancesSafe(BotTokenWalletEntity, wallets)
  }

  async updateTokenInvestedEth(address: string, investedEth: string) {
    const updatedToken = await this.prisma.botToken.update({
      where: { address },
      data: {
        investedEth: investedEth,
      },
    })
    return th.toInstanceSafe(BotTokenEntity, updatedToken)
  }
}
