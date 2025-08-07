import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from 'nestjs-prisma'
import { parsedSwapEventToDb, swapLib } from '../libs/swap.lib'
import { getContractCreation } from '../helpers/ethers-scan.helper'
import { chunk } from 'lodash'
import { logl } from '@app/helper/log.helper'

@Injectable()
export class SwapCronService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async triggerScanSwapEvents() {
    try {
      await this.handleScanSwapEvents({ fee: 10000 })
    } catch (error) {
      logl('ScanSwapEvents error', error)
    }
  }

  async handleScanSwapEvents(options: { fee: number }) {
    const tokens = await this.prisma.botToken.findMany({
      where: {
        enabled: true,
      },
    })
    // console.log('tokens', tokens)
    for (const token of tokens) {
      let fromBlock = token.scannedToBlock
      if (!token.scannedToBlock) {
        const ress = await getContractCreation({
          address: token.address,
          chainId: token.chainId,
        })
        fromBlock = Number(ress.result[0].blockNumber)
      }
      const swaps = await swapLib.scanSwap({
        token: token.address,
        chainId: token.chainId,
        fee: token.fee,
        fromBlock,
      })
      // logl(`ScanSwapEvents: ${token.address} ${swaps.length} swaps`)
      const swapChunks = chunk(swaps, 1000)
      if (swaps.length > 0) {
        const lastBlock = swaps[swaps.length - 1].rawSwapLog.blockNumber
        await this.prisma.$transaction(async (tx) => {
          for (const swapChunk of swapChunks) {
            await tx.tokenSwap.createMany({
              data: swapChunk.map((swap) =>
                parsedSwapEventToDb({ swapEvent: swap, token: token.address, chainId: token.chainId }),
              ),
              skipDuplicates: true,
            })
          }
          await tx.botToken.update({
            where: { address: token.address },
            data: { scannedToBlock: lastBlock },
          })
        })
      }
    }
  }
}
