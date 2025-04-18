-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value, created_at, updated_at)
VALUES 
  ('openai_api_key', '', NOW(), NOW()),
  ('openai_system_prompt', 'You are a helpful assistant that responds to customer requests. Your goal is to understand the customer needs and provide clear, concise and helpful responses.', NOW(), NOW()),
  ('openai_user_prompt', 'Please respond to the following customer message in a professional and helpful manner:', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;