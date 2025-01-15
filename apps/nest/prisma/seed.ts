import { Hash } from '../libs/helper/src/hash.helper'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
async function main() {
  console.log({
    SUPER_ADMIN_USERNAME: process.env.SUPER_ADMIN_USERNAME,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
  })
  if (process.env.SUPER_ADMIN_USERNAME && process.env.SUPER_ADMIN_PASSWORD) {
    const x = await prisma.user.create({
      data: {
        username: process.env.SUPER_ADMIN_USERNAME,
        password: Hash.make(process.env.SUPER_ADMIN_PASSWORD),
        provider: 'LOCAL',
        role: 'SUPERADMIN',
        confirmed: true,
        profile: {
          create: {
            name: 'Super Admin',
          },
        },
      },
    })
    console.log({ x })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
