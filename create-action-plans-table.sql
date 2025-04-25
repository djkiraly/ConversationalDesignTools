-- Create action_plans table
CREATE TABLE IF NOT EXISTS action_plans (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  industry TEXT,
  primary_channel TEXT,
  interaction_volume TEXT,
  current_automation TEXT,
  biggest_challenge TEXT,
  repetitive_processes TEXT,
  ai_goals JSONB NOT NULL DEFAULT '[]',
  autonomy_level TEXT,
  current_platforms TEXT,
  team_comfort TEXT,
  apis_available TEXT,
  success_metrics JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);