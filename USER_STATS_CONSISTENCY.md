# User Stats Consistency Check

## The Math Behind Rep Levels and Hours

When setting up user profiles with specific **Rep Levels** and **Average Quality Ratings**, the stats must be mathematically consistent.

### Key Formulas

1. **Merets Earned per Task:**
   ```
   merets = (effort_minutes / 60) × quality_multiplier
   ```

2. **Quality Multipliers:**
   - 5 stars: 1.20×
   - 4.5 stars: 1.10× (average between 4★ and 5★)
   - 4 stars: 1.00×
   - 3 stars: 0.70×
   - 2 stars: 0.40×
   - 1 star: 0.20×

3. **Hours Worked (reverse calculation):**
   ```
   hours_worked = lifetime_merets / average_quality_multiplier
   ```

4. **Total Earnings:**
   ```
   total_earnings = hours_worked × average_hourly_rate
   ```

### Rep Level Progression

| Level Range | Merets per Level | Cumulative at End |
|-------------|------------------|-------------------|
| 1-10        | 1 meret each     | 10 merets         |
| 11-20       | 3 merets each    | 40 merets         |
| 21-30       | 4 merets each    | 80 merets         |
| 31-50       | 1.0932× growth   | ~480 merets       |
| 51-70       | 2× every 10 lvls | ~1,900 merets     |
| 71-90       | 1.0505× growth   | ~5,000 merets     |
| 91-99       | 1.0801× growth   | ~10,000 merets    |

## Current User Stats (Consistent)

### Aveya - Rep Level 24
- **Rep Score:** 24
- **Lifetime Merets:** 56 (10 + 30 + 16)
- **Average Quality Rating:** 4.5 stars
- **Quality Multiplier:** 1.10×
- **Implied Hours Worked:** 56 ÷ 1.10 = **50.91 hours**
- **Total Earnings:** $916.36 (at $18/hour average)

### Onyx - Rep Level 22
- **Rep Score:** 22
- **Lifetime Merets:** 48 (10 + 30 + 8)
- **Average Quality Rating:** 4.5 stars
- **Quality Multiplier:** 1.10×
- **Implied Hours Worked:** 48 ÷ 1.10 = **43.64 hours**
- **Total Earnings:** $785.45 (at $18/hour average)

## Why This Matters

When you see a user with:
- Rep Level 24
- Average rating of 4.5 stars

You should be able to calculate that they've worked approximately **51 hours** to earn those 56 merets. This ensures the progression system feels realistic and consistent.

If the stats don't match up (e.g., Rep 24 but only 20 merets), it would indicate either:
1. Data inconsistency that needs fixing
2. The user received bonus merets from somewhere
3. The rep level was manually adjusted

## Verification Query

Run this in Supabase to check consistency:

```sql
SELECT 
  name,
  rep_score,
  lifetime_merets,
  average_quality_rating,
  total_earnings_cents / 100.0 as total_earnings_dollars,
  ROUND(lifetime_merets / average_quality_rating, 2) as implied_hours_worked,
  ROUND((total_earnings_cents / 100.0) / (lifetime_merets / average_quality_rating), 2) as implied_hourly_rate
FROM user_profiles
WHERE name IN ('Onyx', 'Aveya')
ORDER BY name;
```

Expected output:
- **Onyx:** 22, 48, 4.5, $785.45, 43.64 hours, $18.00/hr
- **Aveya:** 24, 56, 4.5, $916.36, 50.91 hours, $18.00/hr
