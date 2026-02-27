
-- D7-F2: Add window_booking to fulfillment_mode enum
ALTER TYPE fulfillment_mode ADD VALUE IF NOT EXISTS 'window_booking';
