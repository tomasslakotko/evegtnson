-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "subscriptionPlan" TEXT DEFAULT 'free';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subscriptionPlan" TEXT DEFAULT 'free';
