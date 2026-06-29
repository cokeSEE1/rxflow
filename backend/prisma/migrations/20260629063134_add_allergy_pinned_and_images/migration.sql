-- AlterTable
ALTER TABLE `PatientAllergy` ADD COLUMN `pinned` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `AllergyImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientAllergyId` INTEGER NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AllergyImage_patientAllergyId_idx`(`patientAllergyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AllergyImage` ADD CONSTRAINT `AllergyImage_patientAllergyId_fkey` FOREIGN KEY (`patientAllergyId`) REFERENCES `PatientAllergy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
