-- AlterEnum: Add STUDENT to Role enum
ALTER TYPE "Role" ADD VALUE 'STUDENT';

-- CreateEnum: ProgressStatus
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable: Add classId to User table
ALTER TABLE "User" ADD COLUMN "classId" TEXT;

-- AlterTable: Add coverUrl to Book table
ALTER TABLE "Book" ADD COLUMN "coverUrl" TEXT;

-- AlterTable: Add name, email, bookId to StudentQuestion table
ALTER TABLE "StudentQuestion" ADD COLUMN "name" TEXT;
ALTER TABLE "StudentQuestion" ADD COLUMN "email" TEXT;
ALTER TABLE "StudentQuestion" ADD COLUMN "bookId" TEXT;

-- CreateTable: LearningProgress
CREATE TABLE "LearningProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT,
    "videoId" TEXT,
    "status" "ProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'QUESTION_ANSWER',
    "targetUrl" TEXT,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Note
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "pdfFileName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Note_slug_key" ON "Note"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_bookId_key" ON "LearningProgress"("userId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_videoId_key" ON "LearningProgress"("userId", "videoId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_type_targetUrl_idx" ON "Notification"("userId", "type", "targetUrl");

-- AddForeignKey: User.classId
ALTER TABLE "User" ADD CONSTRAINT "User_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: StudentQuestion.bookId
ALTER TABLE "StudentQuestion" ADD CONSTRAINT "StudentQuestion_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: LearningProgress.user
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: LearningProgress.book
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: LearningProgress.video
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Notification.user
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Notification.question
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "StudentQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
