-- AlterTable
ALTER TABLE `questions`
  ADD COLUMN `correct_feedback` TEXT NULL,
  ADD COLUMN `incorrect_feedback` TEXT NULL;

