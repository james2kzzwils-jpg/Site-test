-- Add 'client_approved' to the stage_state enum so the workflow
-- can distinguish "client said yes" from "admin confirmed + advance".

ALTER TYPE stage_state ADD VALUE IF NOT EXISTS 'client_approved' AFTER 'in_review';
