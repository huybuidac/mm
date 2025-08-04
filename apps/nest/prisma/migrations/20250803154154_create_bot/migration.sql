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
    "chainId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotToken_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "TokenSwap" (
    "txHash" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "isBuy" BOOLEAN NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "fee" DECIMAL(18,0) NOT NULL,
    "tokenAmount" DECIMAL(30,0) NOT NULL,
    "ethAmount" DECIMAL(30,0) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BotTokenWallet_walletAddress_tokenAddress_key" ON "BotTokenWallet"("walletAddress", "tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TokenSwap_txHash_index_key" ON "TokenSwap"("txHash", "index");

-- AddForeignKey
ALTER TABLE "BotTokenWallet" ADD CONSTRAINT "BotTokenWallet_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "BotWallet"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotTokenWallet" ADD CONSTRAINT "BotTokenWallet_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "BotToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenSwap" ADD CONSTRAINT "TokenSwap_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "BotToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
