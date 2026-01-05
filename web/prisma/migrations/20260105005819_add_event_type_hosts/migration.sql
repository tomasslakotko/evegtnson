/*
  Warnings:

  - The primary key for the `EventTypeHost` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `EventTypeHost` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "EventTypeHost_eventTypeId_userId_key";

-- AlterTable
ALTER TABLE "EventTypeHost" DROP CONSTRAINT "EventTypeHost_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "EventTypeHost_pkey" PRIMARY KEY ("eventTypeId", "userId");
