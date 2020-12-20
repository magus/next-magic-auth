CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."user"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created" timestamptz NOT NULL DEFAULT now(), "updated" timestamptz NOT NULL DEFAULT now(), "email" text NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"));
