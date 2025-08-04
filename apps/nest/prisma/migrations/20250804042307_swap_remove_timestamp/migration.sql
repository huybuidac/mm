/*
  Warnings:

  - You are about to drop the column `timestamp` on the `TokenSwap` table. All the data in the column will be lost.
  - Added the required column `blockNumber` to the `TokenSwap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobId` to the `TokenSwap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "mm"."TokenSwap" DROP COLUMN "timestamp",
ADD COLUMN     "blockNumber" INTEGER NOT NULL,
ADD COLUMN     "jobId" INTEGER NOT NULL;
