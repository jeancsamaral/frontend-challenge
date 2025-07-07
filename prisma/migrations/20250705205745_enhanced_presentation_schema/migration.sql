/*
  Warnings:

  - You are about to drop the column `settings` on the `slides` table. All the data in the column will be lost.
  - You are about to drop the `interactive_slides` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ElementType" ADD VALUE 'VIDEO';
ALTER TYPE "ElementType" ADD VALUE 'AUDIO';
ALTER TYPE "ElementType" ADD VALUE 'EMBED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InteractiveType" ADD VALUE 'RANKING';
ALTER TYPE "InteractiveType" ADD VALUE 'QUIZ';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SlideType" ADD VALUE 'TITLE';
ALTER TYPE "SlideType" ADD VALUE 'SECTION';
ALTER TYPE "SlideType" ADD VALUE 'CONCLUSION';

-- DropForeignKey
ALTER TABLE "interactive_slides" DROP CONSTRAINT "interactive_slides_slideId_fkey";

-- AlterTable
ALTER TABLE "presentations" ADD COLUMN     "allowAnonymousResponses" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasInteractiveElements" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxResponsesPerStudent" INTEGER DEFAULT 1,
ADD COLUMN     "requireStudentName" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "theme" JSONB;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "allowLateJoin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "collectEmails" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "showResults" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "title" TEXT,
ADD COLUMN     "totalParticipants" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalResponses" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "slide_elements" ADD COLUMN     "animations" JSONB,
ADD COLUMN     "interactions" JSONB,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "zIndex" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "slides" DROP COLUMN "settings",
ADD COLUMN     "animations" JSONB,
ADD COLUMN     "background" JSONB,
ADD COLUMN     "correctAnswers" JSONB,
ADD COLUMN     "interactiveSettings" JSONB,
ADD COLUMN     "interactiveType" "InteractiveType",
ADD COLUMN     "isInteractive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "layout" JSONB,
ADD COLUMN     "options" JSONB,
ADD COLUMN     "question" TEXT;

-- AlterTable
ALTER TABLE "student_responses" ADD COLUMN     "isCorrect" BOOLEAN,
ADD COLUMN     "points" INTEGER,
ADD COLUMN     "responseTime" INTEGER,
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- DropTable
DROP TABLE "interactive_slides";
