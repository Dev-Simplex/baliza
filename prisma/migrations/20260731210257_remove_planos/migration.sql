-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_organizationId_fkey";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Subscription";

-- DropEnum
DROP TYPE "PlanCode";

-- DropEnum
DROP TYPE "SubscriptionStatus";

