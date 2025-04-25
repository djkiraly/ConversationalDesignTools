-- Add goal_details column to action_plans table
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS goal_details JSONB NOT NULL DEFAULT '{}';