ALTER TABLE "stations" ADD COLUMN "skipScratch" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "taskAudioUrl" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "caption" text;