-- CreateTable
CREATE TABLE "SpacedRepetition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "savedArticleId" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "interval" INTEGER NOT NULL,
    "keyPoints" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpacedRepetition_savedArticleId_fkey" FOREIGN KEY ("savedArticleId") REFERENCES "SavedArticle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConceptMention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "concept" TEXT NOT NULL,
    "articleId" TEXT,
    "bookId" TEXT,
    "context" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ConceptMention_concept_idx" ON "ConceptMention"("concept");
