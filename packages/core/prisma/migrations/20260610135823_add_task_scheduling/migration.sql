-- AlterTable
ALTER TABLE "Task" ADD COLUMN "scheduledDay" DATETIME;
ALTER TABLE "Task" ADD COLUMN "scheduledTime" TEXT;

-- CreateIndex
CREATE INDEX "Task_scheduledDay_idx" ON "Task"("scheduledDay");
