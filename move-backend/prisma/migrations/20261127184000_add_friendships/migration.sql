CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "lowUserId" TEXT NOT NULL,
    "highUserId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Friendship_not_self_check" CHECK ("requesterId" <> "addresseeId"),
    CONSTRAINT "Friendship_canonical_pair_check" CHECK (
        "lowUserId" < "highUserId"
        AND (
            ("requesterId" = "lowUserId" AND "addresseeId" = "highUserId")
            OR ("requesterId" = "highUserId" AND "addresseeId" = "lowUserId")
        )
    )
);

CREATE UNIQUE INDEX "Friendship_lowUserId_highUserId_key"
    ON "Friendship"("lowUserId", "highUserId");
CREATE INDEX "Friendship_addresseeId_status_idx"
    ON "Friendship"("addresseeId", "status");
CREATE INDEX "Friendship_requesterId_status_idx"
    ON "Friendship"("requesterId", "status");

ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_addresseeId_fkey"
    FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_lowUserId_fkey"
    FOREIGN KEY ("lowUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_highUserId_fkey"
    FOREIGN KEY ("highUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
