ALTER TABLE "stations" ADD COLUMN "taskType" varchar(20) DEFAULT 'photo' NOT NULL;--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "taskAnswer" text;