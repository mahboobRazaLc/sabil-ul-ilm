-- DropIndex
DROP INDEX "PasswordResetToken_token_idx";

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "StudentQuestion_status_idx" ON "StudentQuestion"("status");

-- CreateIndex
CREATE INDEX "StudentQuestion_authorId_idx" ON "StudentQuestion"("authorId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
