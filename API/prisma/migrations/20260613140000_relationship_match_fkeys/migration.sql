-- AddForeignKey
ALTER TABLE "relationship_matches" ADD CONSTRAINT "relationship_matches_incoming_ocr_job_id_fkey" FOREIGN KEY ("incoming_ocr_job_id") REFERENCES "ocr_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_matches" ADD CONSTRAINT "relationship_matches_matched_contact_id_fkey" FOREIGN KEY ("matched_contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "relationship_matches_incoming_ocr_job_id_idx" ON "relationship_matches"("incoming_ocr_job_id");

-- CreateIndex
CREATE INDEX "relationship_matches_matched_contact_id_idx" ON "relationship_matches"("matched_contact_id");
