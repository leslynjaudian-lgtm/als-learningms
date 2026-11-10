-- Drop unique index on learning_areas.code so multiple Learning Strands can share the same code (e.g. LS1)
DROP INDEX `learning_areas_code_key` ON `learning_areas`;

-- Add non-unique index on code
CREATE INDEX `learning_areas_code_idx` ON `learning_areas`(`code`);

-- Update default status casing to match Admin Portal
ALTER TABLE `learning_areas` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'Active';

