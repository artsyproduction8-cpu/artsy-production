-- =============================================================================
-- Migration: 006_sequential_invoice_numbering.sql
-- Description: CBIC-compliant sequential invoice numbering (AP/{FY}/{seq})
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  seq_num BIGINT;
  today DATE := CURRENT_DATE;
  fy_start_year INT;
  fy_end_year INT;
  fy_string TEXT;
BEGIN
  IF EXTRACT(MONTH FROM today) >= 4 THEN
    fy_start_year := EXTRACT(YEAR FROM today)::INT;
    fy_end_year := (fy_start_year + 1) % 100;
    fy_string := LPAD((fy_start_year % 100)::TEXT, 2, '0') || '-' || LPAD(fy_end_year::TEXT, 2, '0');
  ELSE
    fy_start_year := EXTRACT(YEAR FROM today)::INT - 1;
    fy_end_year := (fy_start_year + 1) % 100;
    fy_string := LPAD((fy_start_year % 100)::TEXT, 2, '0') || '-' || LPAD(fy_end_year::TEXT, 2, '0');
  END IF;

  seq_num := nextval('invoice_number_seq');
  RETURN 'AP/' || fy_string || '/' || LPAD(seq_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
