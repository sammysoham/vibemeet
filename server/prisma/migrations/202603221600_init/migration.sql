CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNSPECIFIED');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "password_hash" TEXT,
  "display_name" TEXT NOT NULL,
  "gender" "Gender" NOT NULL,
  "is_premium" BOOLEAN NOT NULL DEFAULT false,
  "is_guest" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "matches" (
  "id" TEXT NOT NULL,
  "user1_id" TEXT NOT NULL,
  "user2_id" TEXT,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ended_at" TIMESTAMP(3),
  "is_ai_fallback" BOOLEAN NOT NULL DEFAULT false,
  "room_id" TEXT,

  CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reports" (
  "id" TEXT NOT NULL,
  "reporter_id" TEXT NOT NULL,
  "reported_user" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "stripe_customer_id" TEXT,
  "stripe_subscription_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

ALTER TABLE "matches"
ADD CONSTRAINT "matches_user1_id_fkey"
FOREIGN KEY ("user1_id")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "matches"
ADD CONSTRAINT "matches_user2_id_fkey"
FOREIGN KEY ("user2_id")
REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "reports"
ADD CONSTRAINT "reports_reporter_id_fkey"
FOREIGN KEY ("reporter_id")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "reports"
ADD CONSTRAINT "reports_reported_user_fkey"
FOREIGN KEY ("reported_user")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "subscriptions"
ADD CONSTRAINT "subscriptions_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
