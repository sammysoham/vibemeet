-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accepted_terms_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "friend_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friendships_user_id_friend_id_key" ON "friendships"("user_id", "friend_id");

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
