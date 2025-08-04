import { Injectable } from '@nestjs/common'
import { ethers } from 'ethers'
import { th } from '@app/helper/transform.helper'
import { CreateBotTokenDto } from '../dtos/create-bot-token.dto'
import { CreateBotTokenWalletsDto } from '../dtos/create-bot-token-wallets.dto'
import { BotTokenEntity } from '../entities/bot-token.entity'
import { BotTokenWalletEntity } from '../entities/bot-token-wallet.entity'
import { PrismaService } from 'nestjs-prisma'

@Injectable()
export class BotConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async createBotToken(dto: CreateBotTokenDto): Promise<BotTokenEntity> {
    const botToken = await this.prisma.botToken.create({
      data: {
        address: dto.address,
        chainId: dto.chainId,
      },
    })
    return th.toInstanceSafe(BotTokenEntity, botToken)
  }

  async createBotTokenWallets(dto: CreateBotTokenWalletsDto): Promise<BotTokenWalletEntity[]> {
    await this.prisma.botToken.findUniqueOrThrow({
      where: { address: dto.tokenAddress },
    })

    const wallets = dto.wallets.map((wallet) => ({
      address: new ethers.Wallet(wallet.privateKey).address,
      ...wallet,
    }))

    await this.prisma.botWallet.createMany({
      data: wallets.map((wallet) => ({
        address: wallet.address,
        privateKey: wallet.privateKey,
      })),
      skipDuplicates: true,
    })
    const results = await this.prisma.botTokenWallet.createManyAndReturn({
      data: wallets.map((wallet) => ({
        walletAddress: wallet.address,
        tokenAddress: dto.tokenAddress,
        buyable: wallet.buyable,
        sellable: wallet.sellable,
      })),
      skipDuplicates: true,
      include: {
        wallet: true,
      },
    })
    return th.toInstancesSafe(BotTokenWalletEntity, results)
  }
}
