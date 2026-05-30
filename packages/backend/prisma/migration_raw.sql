-- ==============================================================================
-- PETSGRAM Enterprise Relational Database Raw PostgreSQL DDL Schema Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Custom Enum Types
CREATE TYPE "Role" AS ENUM ('USER', 'FOSTER', 'SHELTER', 'MODERATOR', 'ADMIN');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ListingType" AS ENUM ('ADOPTION', 'FOSTER', 'RESCUE', 'LOST');

-- 1. Create Users Table
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "role" "Role" NOT NULL DEFAULT 'USER',
    "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
    "verification_token" VARCHAR(255),
    "password_reset_token" VARCHAR(255),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP WITH TIME ZONE,
    "deleted_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Shelters Table
CREATE TABLE "shelters" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID UNIQUE NOT NULL,
    "tax_id" VARCHAR(50) UNIQUE NOT NULL,
    "organization_name" VARCHAR(150) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_shelters_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- 3. Create Locations Table
CREATE TABLE "locations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(150) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Pets Table
CREATE TABLE "pets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "type" "ListingType" NOT NULL DEFAULT 'ADOPTION',
    "breed" VARCHAR(100) NOT NULL,
    "age" VARCHAR(50) NOT NULL,
    "gender" VARCHAR(10) NOT NULL,
    "images" TEXT[] NOT NULL,
    "description" TEXT NOT NULL,
    "vaccinated" BOOLEAN NOT NULL DEFAULT FALSE,
    "microchipped" BOOLEAN NOT NULL DEFAULT FALSE,
    "neutered" BOOLEAN NOT NULL DEFAULT FALSE,
    "temperaments" VARCHAR[] NOT NULL,
    "owner_id" UUID NOT NULL,
    "location_id" UUID,
    "deleted_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_pets_owner" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_pets_location" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE SET NULL
);

-- 5. Create Applications Table
CREATE TABLE "applications" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "pet_id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "home_type" VARCHAR(100) NOT NULL,
    "has_yard" BOOLEAN NOT NULL DEFAULT FALSE,
    "experience_level" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_applications_pet" FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_applications_applicant" FOREIGN KEY ("applicant_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- 6. Create Conversations Table
CREATE TABLE "conversations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "pet_id" UUID,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_conversations_pet" FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") ON DELETE SET NULL
);

-- 7. Create Conversation Participants (Bridge Table)
CREATE TABLE "conversation_participants" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_participants_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_participants_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    CONSTRAINT "unique_conversation_user" UNIQUE ("conversation_id", "user_id")
);

-- 8. Create Messages Table
CREATE TABLE "messages" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "media_url" VARCHAR(2083),
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "voice_duration" VARCHAR(10),
    "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- 9. Create Comments Table
CREATE TABLE "comments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "pet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "deleted_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_comments_pet" FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_comments_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- 10. Create Likes Table
CREATE TABLE "likes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "pet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_likes_pet" FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_likes_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    CONSTRAINT "unique_pet_user_like" UNIQUE ("pet_id", "user_id")
);

-- 11. Create Reports Table
CREATE TABLE "reports" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "reporter_id" UUID NOT NULL,
    "reported_user_id" UUID,
    "pet_id" UUID,
    "reason" TEXT NOT NULL,
    "is_reviewed" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_reports_reporter" FOREIGN KEY ("reporter_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_reports_reported_user" FOREIGN KEY ("reported_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
    CONSTRAINT "fk_reports_pet" FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") ON DELETE SET NULL
);

-- 12. Create Badges Table
CREATE TABLE "badges" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "icon_type" VARCHAR(50) NOT NULL,
    "awarded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_badges_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- ==============================================================================
-- INDEXES & GEOSPATIAL OPTIMIZATIONS
-- ==============================================================================

CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_users_role" ON "users"("role");
CREATE INDEX "idx_shelters_user_id" ON "shelters"("user_id");
CREATE INDEX "idx_pets_owner_id" ON "pets"("owner_id");
CREATE INDEX "idx_pets_category_type" ON "pets"("category", "type");
CREATE INDEX "idx_pets_breed" ON "pets"("breed");
CREATE INDEX "idx_applications_pet_id" ON "applications"("pet_id");
CREATE INDEX "idx_applications_applicant_id" ON "applications"("applicant_id");
CREATE INDEX "idx_messages_conversation_id" ON "messages"("conversation_id");
CREATE INDEX "idx_comments_pet_id" ON "comments"("pet_id");
CREATE INDEX "idx_badges_user_id" ON "badges"("user_id");

-- Geospatial B-Tree/GiST coordinate index to handle Map radius search metrics
CREATE INDEX "idx_locations_coordinates" ON "locations"("lat", "lng");

-- ==============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_shelters_updated_at BEFORE UPDATE ON "shelters" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_locations_updated_at BEFORE UPDATE ON "locations" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_pets_updated_at BEFORE UPDATE ON "pets" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_applications_updated_at BEFORE UPDATE ON "applications" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_conversations_updated_at BEFORE UPDATE ON "conversations" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_comments_updated_at BEFORE UPDATE ON "comments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
