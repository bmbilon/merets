-- Test the average rating calculation that's causing overflow
SELECT 
    0.00 as current_avg,
    0 as current_count,
    5 as new_rating,
    (0.00 * 0 + 5::NUMERIC) / (0 + 1) as calculated_avg,
    ((0.00 * 0 + 5::NUMERIC) / (0 + 1))::NUMERIC(5,2) as cast_to_5_2;
