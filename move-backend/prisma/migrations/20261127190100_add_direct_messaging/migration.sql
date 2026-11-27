CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "participantAId" TEXT NOT NULL,
    "participantBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Conversation_distinct_participants_check" CHECK ("participantAId" <> "participantBId"),
    CONSTRAINT "Conversation_canonical_participants_check" CHECK ("participantAId" < "participantBId")
);

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Message_nonempty_content_check" CHECK (char_length(btrim("content")) > 0)
);

CREATE UNIQUE INDEX "Conversation_participantAId_participantBId_key"
    ON "Conversation"("participantAId", "participantBId");
CREATE INDEX "Conversation_participantAId_updatedAt_idx"
    ON "Conversation"("participantAId", "updatedAt");
CREATE INDEX "Conversation_participantBId_updatedAt_idx"
    ON "Conversation"("participantBId", "updatedAt");
CREATE INDEX "Message_conversationId_createdAt_idx"
    ON "Message"("conversationId", "createdAt");
CREATE INDEX "Message_conversationId_senderId_readAt_idx"
    ON "Message"("conversationId", "senderId", "readAt");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participantAId_fkey"
    FOREIGN KEY ("participantAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participantBId_fkey"
    FOREIGN KEY ("participantBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
