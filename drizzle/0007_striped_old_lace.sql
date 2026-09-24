ALTER TABLE `photos` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH ordered AS (SELECT id,ROW_NUMBER() OVER (ORDER BY created DESC,id)-1 AS rank FROM photos)
UPDATE photos SET position=(SELECT rank FROM ordered WHERE ordered.id=photos.id);
