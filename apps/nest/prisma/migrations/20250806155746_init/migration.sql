-- CreateEnum
CREATE TYPE "UserProvider" AS ENUM ('USERNAME', 'LOCAL', 'google', 'apple', 'facebook');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "TodoStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "profileId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "jwtValidFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmationHash" TEXT,
    "provider" "UserProvider" NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "verifyCode" TEXT,
    "verifyCodeCount" INTEGER NOT NULL DEFAULT 0,
    "verifyCreatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dob" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "email" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TodoStatus" NOT NULL DEFAULT 'TODO',
    "profileId" BIGINT NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotWallet" (
    "address" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotWallet_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "BotTokenWallet" (
    "walletAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "buyable" BOOLEAN NOT NULL,
    "sellable" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "BotToken" (
    "address" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scannedToBlock" INTEGER NOT NULL DEFAULT 0,
    "chainId" TEXT NOT NULL,
    "fee" INTEGER NOT NULL DEFAULT 500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotToken_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "TokenSwap" (
    "txHash" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "jobId" TEXT,
    "isBuy" BOOLEAN NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "tokenAmount" DECIMAL(30,0) NOT NULL,
    "ethAmount" DECIMAL(30,0) NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "amount0" DECIMAL(30,0) NOT NULL,
    "amount1" DECIMAL(30,0) NOT NULL,
    "sqrtPriceX96" TEXT NOT NULL,
    "liquidity" DECIMAL(30,0) NOT NULL,
    "tick" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_verifyCode_key" ON "User"("verifyCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_provider_key" ON "User"("username", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "BotTokenWallet_walletAddress_tokenAddress_key" ON "BotTokenWallet"("walletAddress", "tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TokenSwap_txHash_index_key" ON "TokenSwap"("txHash", "index");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotTokenWallet" ADD CONSTRAINT "BotTokenWallet_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "BotWallet"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotTokenWallet" ADD CONSTRAINT "BotTokenWallet_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "BotToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenSwap" ADD CONSTRAINT "TokenSwap_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "BotToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
