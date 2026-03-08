-- CreateEnum
CREATE TYPE "WineType" AS ENUM ('RED', 'WHITE', 'ROSE', 'SPARKLING', 'DESSERT', 'FORTIFIED', 'ORANGE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FieldSource" AS ENUM ('IMAGE', 'INTERNET', 'USER', 'INFERRED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING');

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Winery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Winery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldValue" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" "FieldSource" NOT NULL DEFAULT 'UNKNOWN',
    "rawText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wine" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandId" TEXT,
    "nameId" TEXT,
    "vintageId" TEXT,
    "countryId" TEXT,
    "regionId" TEXT,
    "appellationId" TEXT,
    "type" "WineType" NOT NULL DEFAULT 'UNKNOWN',
    "typeSource" "FieldSource" NOT NULL DEFAULT 'UNKNOWN',
    "typeConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isNonVintage" BOOLEAN NOT NULL DEFAULT false,
    "wineryId" TEXT,
    "mergedIntoId" TEXT,

    CONSTRAINT "Wine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WineVarietal" (
    "id" TEXT NOT NULL,
    "wineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" "FieldSource" NOT NULL DEFAULT 'UNKNOWN',

    CONSTRAINT "WineVarietal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WinePhoto" (
    "id" TEXT NOT NULL,
    "wineId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "uploadBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WinePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WineExpectedProfile" (
    "id" TEXT NOT NULL,
    "wineId" TEXT NOT NULL,
    "aroma" TEXT,
    "palate" TEXT,
    "finish" TEXT,
    "acidity" TEXT,
    "tannin" TEXT,
    "alcohol" TEXT,
    "sweetness" TEXT,
    "body" TEXT,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'perplexity',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawResponse" JSONB,

    CONSTRAINT "WineExpectedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TastingEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "wineId" TEXT NOT NULL,
    "tripId" TEXT,
    "dateDrank" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER,
    "audioStorageKey" TEXT,
    "audioTranscript" TEXT,
    "audioProcessedAt" TIMESTAMP(3),
    "aroma" TEXT,
    "palate" TEXT,
    "finish" TEXT,
    "acidity" TEXT,
    "tannin" TEXT,
    "alcohol" TEXT,
    "sweetness" TEXT,
    "body" TEXT,
    "otherNotes" TEXT,

    CONSTRAINT "TastingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPerson" (
    "tripId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "TripPerson_pkey" PRIMARY KEY ("tripId","personId")
);

-- CreateTable
CREATE TABLE "TripWinery" (
    "tripId" TEXT NOT NULL,
    "wineryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TripWinery_pkey" PRIMARY KEY ("tripId","wineryId")
);

-- CreateTable
CREATE TABLE "UploadBatch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "totalPhotos" INTEGER NOT NULL,
    "tripId" TEXT,

    CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "extractedFields" JSONB,
    "groupingHint" TEXT,
    "wineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

-- CreateIndex
CREATE INDEX "Person_name_idx" ON "Person"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Winery_name_key" ON "Winery"("name");

-- CreateIndex
CREATE INDEX "Winery_name_idx" ON "Winery"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Wine_brandId_key" ON "Wine"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "Wine_nameId_key" ON "Wine"("nameId");

-- CreateIndex
CREATE UNIQUE INDEX "Wine_vintageId_key" ON "Wine"("vintageId");

-- CreateIndex
CREATE UNIQUE INDEX "Wine_countryId_key" ON "Wine"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "Wine_regionId_key" ON "Wine"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Wine_appellationId_key" ON "Wine"("appellationId");

-- CreateIndex
CREATE INDEX "Wine_wineryId_idx" ON "Wine"("wineryId");

-- CreateIndex
CREATE INDEX "Wine_type_idx" ON "Wine"("type");

-- CreateIndex
CREATE INDEX "Wine_mergedIntoId_idx" ON "Wine"("mergedIntoId");

-- CreateIndex
CREATE INDEX "WineVarietal_wineId_idx" ON "WineVarietal"("wineId");

-- CreateIndex
CREATE INDEX "WineVarietal_name_idx" ON "WineVarietal"("name");

-- CreateIndex
CREATE INDEX "WinePhoto_wineId_idx" ON "WinePhoto"("wineId");

-- CreateIndex
CREATE INDEX "WinePhoto_uploadBatchId_idx" ON "WinePhoto"("uploadBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "WineExpectedProfile_wineId_key" ON "WineExpectedProfile"("wineId");

-- CreateIndex
CREATE INDEX "WineExpectedProfile_wineId_idx" ON "WineExpectedProfile"("wineId");

-- CreateIndex
CREATE INDEX "TastingEntry_wineId_idx" ON "TastingEntry"("wineId");

-- CreateIndex
CREATE INDEX "TastingEntry_tripId_idx" ON "TastingEntry"("tripId");

-- CreateIndex
CREATE INDEX "TastingEntry_dateDrank_idx" ON "TastingEntry"("dateDrank");

-- CreateIndex
CREATE INDEX "Trip_date_idx" ON "Trip"("date");

-- CreateIndex
CREATE INDEX "Trip_location_idx" ON "Trip"("location");

-- CreateIndex
CREATE INDEX "UploadBatchItem_batchId_idx" ON "UploadBatchItem"("batchId");

-- CreateIndex
CREATE INDEX "JobLog_entityId_entityType_idx" ON "JobLog"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "JobLog_status_idx" ON "JobLog"("status");

-- AddForeignKey
ALTER TABLE "Wine" ADD CONSTRAINT "Wine_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "FieldValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wine" ADD CONSTRAINT "Wine_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "FieldValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wine" ADD CONSTRAINT "Wine_vintageId_fkey" FOREIGN KEY ("vintageId") REFERENCES "FieldValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wine" ADD CONSTRAINT "Wine_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "FieldValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wine" ADD CONSTRAINT "Wine_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "FieldValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wine" ADD CONSTRAINT "Wine_appellationId_fkey" FOREIGN KEY ("appellationId") REFERENCES "FieldValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wine" ADD CONSTRAINT "Wine_wineryId_fkey" FOREIGN KEY ("wineryId") REFERENCES "Winery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wine" ADD CONSTRAINT "Wine_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Wine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WineVarietal" ADD CONSTRAINT "WineVarietal_wineId_fkey" FOREIGN KEY ("wineId") REFERENCES "Wine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WinePhoto" ADD CONSTRAINT "WinePhoto_wineId_fkey" FOREIGN KEY ("wineId") REFERENCES "Wine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WineExpectedProfile" ADD CONSTRAINT "WineExpectedProfile_wineId_fkey" FOREIGN KEY ("wineId") REFERENCES "Wine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TastingEntry" ADD CONSTRAINT "TastingEntry_wineId_fkey" FOREIGN KEY ("wineId") REFERENCES "Wine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TastingEntry" ADD CONSTRAINT "TastingEntry_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPerson" ADD CONSTRAINT "TripPerson_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPerson" ADD CONSTRAINT "TripPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripWinery" ADD CONSTRAINT "TripWinery_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripWinery" ADD CONSTRAINT "TripWinery_wineryId_fkey" FOREIGN KEY ("wineryId") REFERENCES "Winery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadBatchItem" ADD CONSTRAINT "UploadBatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
