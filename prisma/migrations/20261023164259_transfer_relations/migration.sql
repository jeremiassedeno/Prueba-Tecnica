-- CreateIndex
CREATE INDEX "Transfer_senderId_idx" ON "Transfer"("senderId");

-- CreateIndex
CREATE INDEX "Transfer_recipientId_idx" ON "Transfer"("recipientId");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
