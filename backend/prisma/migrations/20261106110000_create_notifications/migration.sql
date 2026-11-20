-- AlterTable
ALTER TABLE `users` ADD COLUMN `profile_photo` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `learners`
  ADD COLUMN `first_name` VARCHAR(100) NULL,
  ADD COLUMN `middle_name` VARCHAR(100) NULL,
  ADD COLUMN `last_name` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `modules`
  ADD COLUMN `instructions` TEXT NULL,
  ADD COLUMN `activities_related` TEXT NULL,
  ADD COLUMN `date_started` DATE NULL,
  ADD COLUMN `date_ended` DATE NULL;

-- AlterTable
ALTER TABLE `questions`
  ADD COLUMN `explanation` TEXT NULL;

-- AlterTable
ALTER TABLE `announcements`
  ADD COLUMN `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN `creator_role` ENUM('ADMIN', 'TEACHER', 'LEARNER') NOT NULL DEFAULT 'ADMIN',
  ADD COLUMN `learning_center_id` INTEGER NULL,
  ADD COLUMN `target_learner_id` INTEGER NULL,
  ADD COLUMN `teacher_id` INTEGER NULL,
  ADD COLUMN `program_level` VARCHAR(50) NULL,
  ADD COLUMN `is_important` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `priority` VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN `category` VARCHAR(50) NOT NULL DEFAULT 'ANNOUNCEMENT',
  ADD COLUMN `deadline_at` DATETIME(3) NULL,
  MODIFY `audience` ENUM('ALL', 'TEACHERS', 'LEARNERS', 'ALL_TEACHERS', 'ALL_LEARNERS', 'SPECIFIC_LEARNER', 'INDIVIDUAL_LEARNER') NOT NULL DEFAULT 'ALL_TEACHERS';

-- CreateTable
CREATE TABLE `module_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `module_id` INTEGER NOT NULL,
    `learner_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `due_date` DATE NULL,

    UNIQUE INDEX `module_assignments_module_id_learner_id_key`(`module_id`, `learner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `module_id` INTEGER NOT NULL,
    `learner_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NULL,
    `file_url` VARCHAR(500) NULL,
    `file_name` VARCHAR(255) NULL,
    `content` TEXT NULL,
    `grade` DECIMAL(5, 2) NULL,
    `feedback` TEXT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `end_date` DATE NULL,
    `start_time` VARCHAR(50) NOT NULL,
    `end_time` VARCHAR(50) NOT NULL,
    `activity_type` VARCHAR(100) NOT NULL DEFAULT 'Learning Session',
    `learning_center_id` INTEGER NOT NULL,
    `teacher_id` INTEGER NULL,
    `created_by_user_id` INTEGER NULL,
    `created_by_role` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Upcoming',
    `is_important` BOOLEAN NOT NULL DEFAULT false,
    `priority` VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT 'ANNOUNCEMENT',
    `priority` VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    `is_important` BOOLEAN NOT NULL DEFAULT false,
    `target_role` ENUM('ADMIN', 'TEACHER', 'LEARNER') NOT NULL,
    `target_user_id` INTEGER NULL,
    `target_teacher_id` INTEGER NULL,
    `target_learner_id` INTEGER NULL,
    `learning_center_id` INTEGER NULL,
    `program_level` VARCHAR(50) NULL,
    `source_type` VARCHAR(50) NULL,
    `source_id` INTEGER NULL,
    `link_url` VARCHAR(255) NULL,
    `deadline_at` DATETIME(3) NULL,
    `created_by_role` VARCHAR(50) NULL,
    `created_by_name` VARCHAR(150) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notifications_target_role_target_user_id_idx`(`target_role`, `target_user_id`),
    INDEX `notifications_source_type_source_id_idx`(`source_type`, `source_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_reads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `notification_key` VARCHAR(120) NOT NULL,
    `read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_reads_user_id_idx`(`user_id`),
    UNIQUE INDEX `notification_reads_user_id_notification_key_key`(`user_id`, `notification_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `module_assignments` ADD CONSTRAINT `module_assignments_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `module_assignments` ADD CONSTRAINT `module_assignments_learner_id_fkey` FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_learner_id_fkey` FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_learning_center_id_fkey` FOREIGN KEY (`learning_center_id`) REFERENCES `learning_centers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
