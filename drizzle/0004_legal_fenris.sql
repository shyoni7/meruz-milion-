CREATE TABLE "blessings" (
	"id" serial PRIMARY KEY NOT NULL,
	"teamId" integer NOT NULL,
	"teamName" varchar(255),
	"text" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "station_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"teamId" integer NOT NULL,
	"stationIndex" integer NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "taskAudioUrls" text;