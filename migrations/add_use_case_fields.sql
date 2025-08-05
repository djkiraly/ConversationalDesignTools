-- Add new fields to the use_cases table to properly define and scope the use case

-- Problem Statement (Concise)
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS problem_statement TEXT;

-- Proposed AI Solution (High-level description)
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS proposed_solution TEXT;

-- Key Objectives & Success Metrics (Quantifiable)
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS key_objectives TEXT;

-- Required Data Inputs (Sources, types, availability status)
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS required_data_inputs TEXT;

-- Expected Outputs & Actions
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS expected_outputs TEXT;

-- Key Stakeholders (Business & Technical)
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS key_stakeholders TEXT;

-- High-Level Scope (Inclusions & Exclusions)
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS scope TEXT;

-- Potential Risks & Dependencies
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS potential_risks TEXT;

-- Estimated Impact/Value
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS estimated_impact TEXT;