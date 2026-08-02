CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"displayName" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderIndex" integer DEFAULT 0 NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"clueText" text NOT NULL,
	"clueImageUrl" text,
	"taskTitle" varchar(255) NOT NULL,
	"taskDescription" text NOT NULL,
	"taskImageUrl" text,
	"hint1" text,
	"hint2" text,
	"hint3" text,
	"wazeUrl" text,
	"funFact" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"teamId" integer NOT NULL,
	"stationId" integer NOT NULL,
	"imageUrl" text NOT NULL,
	"imageKey" text NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"adminNote" text,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	"reviewedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"teamName" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"currentStationIndex" integer DEFAULT 0 NOT NULL,
	"isFinished" boolean DEFAULT false NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"finishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
