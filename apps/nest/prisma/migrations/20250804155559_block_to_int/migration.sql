/*
  Warnings:

  - You are about to alter the column `scannedToBlock` on the `BotToken` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "mm"."BotToken" ALTER COLUMN "scannedToBlock" SET DATA TYPE INTEGER;
