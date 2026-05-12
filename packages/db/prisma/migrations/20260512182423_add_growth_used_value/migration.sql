-- CreateTable
CREATE TABLE "GrowthUsedValue" (
    "id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrowthUsedValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GrowthUsedValue_field_idx" ON "GrowthUsedValue"("field");

-- CreateIndex
CREATE UNIQUE INDEX "GrowthUsedValue_field_value_key" ON "GrowthUsedValue"("field", "value");
