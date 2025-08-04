-- CreateTable
CREATE TABLE "mm"."BotWallet" (
    "address" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotWallet_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "mm"."BotTokenWallet" (
    "walletAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "buyable" BOOLEAN NOT NULL,
    "sellable" BOOLEAN NOT NULL,
    "priority" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "mm"."BotToken" (
    "address" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scannedToBlock" BIGINT NOT NULL DEFAULT 0,
    "chainId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotToken_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "mm"."TokenSwap" (
    "txHash" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "jobId" TEXT,
    "isBuy" BOOLEAN NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "tokenAmount" DECIMAL(30,0) NOT NULL,
    "ethAmount" DECIMAL(30,0) NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "amount0" DECIMAL(30,0) NOT NULL,
    "amount1" DECIMAL(30,0) NOT NULL,
    "sqrtPriceX96" BIGINT NOT NULL,
    "liquidity" BIGINT NOT NULL,
    "tick" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BotTokenWallet_walletAddress_tokenAddress_key" ON "mm"."BotTokenWallet"("walletAddress", "tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TokenSwap_txHash_index_key" ON "mm"."TokenSwap"("txHash", "index");

-- AddForeignKey
ALTER TABLE "mm"."BotTokenWallet" ADD CONSTRAINT "BotTokenWallet_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "mm"."BotWallet"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mm"."BotTokenWallet" ADD CONSTRAINT "BotTokenWallet_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "mm"."BotToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mm"."TokenSwap" ADD CONSTRAINT "TokenSwap_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "mm"."BotToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
