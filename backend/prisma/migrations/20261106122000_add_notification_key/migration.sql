-- AlterTable
ALTER TABLE `notifications`
  ADD COLUMN `notification_key` VARCHAR(120) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `notifications_notification_key_key` ON `notifications`(`notification_key`);

