-- AlterTable
ALTER TABLE `Prescription` ADD COLUMN `contentSnapshot` TEXT NULL,
    ADD COLUMN `dispensedAt` DATETIME(3) NULL,
    ADD COLUMN `dispensingAt` DATETIME(3) NULL,
    ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `pharmacistId` INTEGER NULL;

-- AlterTable
ALTER TABLE `PrescriptionItem` ADD COLUMN `drugId` INTEGER NULL,
    ADD COLUMN `pharmacistNote` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `department` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `Drug` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `standardName` VARCHAR(200) NOT NULL,
    `genericName` VARCHAR(200) NOT NULL,
    `tradeName` VARCHAR(200) NULL,
    `specification` VARCHAR(100) NOT NULL,
    `manufacturer` VARCHAR(200) NULL,
    `approvalNumber` VARCHAR(100) NULL,
    `dosageForm` VARCHAR(50) NOT NULL,
    `insuranceCategory` VARCHAR(10) NOT NULL DEFAULT 'self',
    `unit` VARCHAR(20) NOT NULL DEFAULT '盒',
    `packageQuantity` INTEGER NOT NULL DEFAULT 1,
    `referencePrice` DECIMAL(10, 2) NULL,
    `pinyinInitial` VARCHAR(50) NOT NULL,
    `searchCode` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Drug_isActive_idx`(`isActive`),
    INDEX `Drug_insuranceCategory_idx`(`insuranceCategory`),
    INDEX `Drug_dosageForm_idx`(`dosageForm`),
    INDEX `Drug_pinyinInitial_idx`(`pinyinInitial`),
    INDEX `Drug_genericName_idx`(`genericName`),
    UNIQUE INDEX `Drug_genericName_specification_manufacturer_key`(`genericName`, `specification`, `manufacturer`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DrugIngredient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `drugId` INTEGER NOT NULL,
    `allergenId` INTEGER NOT NULL,
    `amount` VARCHAR(50) NULL,

    INDEX `DrugIngredient_allergenId_idx`(`allergenId`),
    UNIQUE INDEX `DrugIngredient_drugId_allergenId_key`(`drugId`, `allergenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Allergen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Allergen_name_key`(`name`),
    INDEX `Allergen_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PatientAllergy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `allergenId` INTEGER NOT NULL,
    `severity` VARCHAR(20) NULL,
    `remark` VARCHAR(500) NULL,
    `source` VARCHAR(20) NOT NULL DEFAULT 'manual',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PatientAllergy_patientId_idx`(`patientId`),
    UNIQUE INDEX `PatientAllergy_patientId_allergenId_key`(`patientId`, `allergenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DrugContraindication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `drugId` INTEGER NOT NULL,
    `description` VARCHAR(500) NOT NULL,

    INDEX `DrugContraindication_drugId_idx`(`drugId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DrugInteraction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `drugAId` INTEGER NOT NULL,
    `drugBId` INTEGER NOT NULL,
    `severity` VARCHAR(20) NOT NULL,
    `description` VARCHAR(500) NOT NULL,

    INDEX `DrugInteraction_drugBId_idx`(`drugBId`),
    UNIQUE INDEX `DrugInteraction_drugAId_drugBId_key`(`drugAId`, `drugBId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DrugBatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `drugId` INTEGER NOT NULL,
    `batchNo` VARCHAR(50) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `unitPrice` DECIMAL(10, 2) NULL,
    `expireDate` DATETIME(3) NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DrugBatch_drugId_idx`(`drugId`),
    INDEX `DrugBatch_expireDate_idx`(`expireDate`),
    INDEX `DrugBatch_quantity_idx`(`quantity`),
    UNIQUE INDEX `DrugBatch_drugId_batchNo_key`(`drugId`, `batchNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `userName` VARCHAR(50) NOT NULL,
    `userRole` VARCHAR(20) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `resource` VARCHAR(50) NOT NULL,
    `resourceId` INTEGER NULL,
    `beforeState` VARCHAR(20) NULL,
    `afterState` VARCHAR(20) NULL,
    `diff` TEXT NULL,
    `result` VARCHAR(20) NOT NULL DEFAULT 'success',
    `ipAddress` VARCHAR(45) NULL,
    `requestId` VARCHAR(100) NULL,
    `contentHash` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_resource_resourceId_idx`(`resource`, `resourceId`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrescriptionVersion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prescriptionId` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `contentHash` VARCHAR(64) NOT NULL,
    `contentJson` TEXT NOT NULL,
    `createdBy` INTEGER NOT NULL,
    `createdByName` VARCHAR(50) NOT NULL,
    `reason` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PrescriptionVersion_prescriptionId_idx`(`prescriptionId`),
    INDEX `PrescriptionVersion_contentHash_idx`(`contentHash`),
    UNIQUE INDEX `PrescriptionVersion_prescriptionId_version_key`(`prescriptionId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Prescription_pharmacistId_idx` ON `Prescription`(`pharmacistId`);

-- CreateIndex
CREATE INDEX `PrescriptionItem_drugId_idx` ON `PrescriptionItem`(`drugId`);

-- AddForeignKey
ALTER TABLE `Prescription` ADD CONSTRAINT `Prescription_pharmacistId_fkey` FOREIGN KEY (`pharmacistId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrescriptionItem` ADD CONSTRAINT `PrescriptionItem_drugId_fkey` FOREIGN KEY (`drugId`) REFERENCES `Drug`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DrugIngredient` ADD CONSTRAINT `DrugIngredient_drugId_fkey` FOREIGN KEY (`drugId`) REFERENCES `Drug`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DrugIngredient` ADD CONSTRAINT `DrugIngredient_allergenId_fkey` FOREIGN KEY (`allergenId`) REFERENCES `Allergen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatientAllergy` ADD CONSTRAINT `PatientAllergy_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatientAllergy` ADD CONSTRAINT `PatientAllergy_allergenId_fkey` FOREIGN KEY (`allergenId`) REFERENCES `Allergen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DrugContraindication` ADD CONSTRAINT `DrugContraindication_drugId_fkey` FOREIGN KEY (`drugId`) REFERENCES `Drug`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DrugInteraction` ADD CONSTRAINT `DrugInteraction_drugAId_fkey` FOREIGN KEY (`drugAId`) REFERENCES `Drug`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DrugInteraction` ADD CONSTRAINT `DrugInteraction_drugBId_fkey` FOREIGN KEY (`drugBId`) REFERENCES `Drug`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DrugBatch` ADD CONSTRAINT `DrugBatch_drugId_fkey` FOREIGN KEY (`drugId`) REFERENCES `Drug`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrescriptionVersion` ADD CONSTRAINT `PrescriptionVersion_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `Prescription`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
