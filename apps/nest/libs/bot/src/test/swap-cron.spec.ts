import { TestContext, testHelper, UserContextTestType } from '@app/spec/test.helper'
import { INestApplication } from '@nestjs/common'
import { PrismaService } from 'nestjs-prisma'
import { BotModule } from '../bot.module'
import { SwapCronService } from '../services/swap-cron.service'

describe('SwapCronSpec', () => {
  jest.setTimeout(100000)

  let tc: TestContext
  let app: INestApplication
  let prismaService: PrismaService
  let uc: UserContextTestType
  let swapCronService: SwapCronService

  beforeAll(async () => {
    tc = await testHelper.createContext({
      imports: [BotModule],
    })
    app = tc.app
    prismaService = app.get(PrismaService)
    uc = await tc.generateAcount()
    swapCronService = app.get(SwapCronService)
  })

  afterAll(async () => {
    return await tc?.clean()
  })

  it('ScanSwapEvents', async () => {
    await prismaService.botToken.upsert({
      where: {
        address: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
      },
      update: {
        enabled: true,
      },
      create: {
        address: '0xAf7b049ad83742C17e2A7f73B616f1ADe6B93078',
        chainId: '11124',
        enabled: true,
        scannedToBlock: 0,
      },
    })
    await swapCronService.handleScanSwapEvents({ fee: 500 })
  })
})
