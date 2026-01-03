# EXPH and Merets Progress Bar Changes

## Summary

This update adds **EXPH (Experience Hours)** tracking, replaces the XP-based progress bar with a **merets-based progress bar**, and fixes the earnings display font size.

## Changes Made

### 1. Database Changes (`ADD_EXPH_FIELD.sql`)

**New Field:**
- Added `experience_hours` column to `user_profiles` table
- EXPH = total hours worked from completed tasks (separate from merets/rep)

**Updated Function:**
- Modified `approve_submission()` to increment `experience_hours` when tasks are approved
- Calculation: `hours_earned = effort_minutes / 60`

**To Apply:**
```sql
-- Run ADD_EXPH_FIELD.sql in Supabase
-- This will:
-- 1. Add experience_hours column
-- 2. Calculate EXPH from existing completed tasks
-- 3. Update approve_submission() function
```

### 2. Frontend Changes

**New Helper Functions** (`lib/merets-helper.ts`):
- `meretsRequiredForLevel(level)` - Calculates total merets needed for a level
- `calculateMeretsProgress(currentMeters, currentLevel)` - Returns progress data including:
  - `meretsRemaining` - How many merets until next level
  - `progress` - Progress percentage (0-1)
  - `meretsForThisLevel` - Total merets needed for current level

**Browse/Earn View Updates** (`components/EarnerTaskMarket.tsx`):
- **Added merets progress bar** showing progress to next Rep Level
  - Displays: "Rep Level 22" → "4 merets to Level 23"
  - Gold progress bar with smooth animation
- **Added EXPH stat box** showing total experience hours (e.g., "43.6h")
- **Reduced Total Earned font size** from 18px to 15px to prevent wrapping
- **Added `numberOfLines={1}` and `adjustsFontSizeToFit`** for better text handling

**Index Updates** (`app/(tabs)/index.tsx`):
- Fetch `lifetime_merets` and `experience_hours` from database
- Pass as props to `EarnerTaskMarket` component

### 3. Stats Display Layout

**Before:**
```
[Total Earned] [Rep Level] [Streak 🔥] [Rep Badge]
```

**After:**
```
Progress Bar: "Rep Level 22" ━━━━━━━━━━ "4 merets to Level 23"

[Total Earned] [Rep Level] [EXPH] [Streak 🔥] [Rep Badge]
```

## Key Concepts

### EXPH vs Merets vs Rep Level

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **EXPH** | Raw hours worked | Sum of all effort_minutes ÷ 60 |
| **Merets** | Quality-adjusted hours | (effort_minutes ÷ 60) × quality_multiplier |
| **Rep Level** | Experience tier | Calculated from lifetime_merets |

**Example:**
- Work 50 hours with 4.5★ average rating
- EXPH = 50.0 hours
- Merets = 50 × 1.10 = 55 merets
- Rep Level = 24 (requires 56 merets)

### Quality Multipliers

| Rating | Multiplier | Effect |
|--------|-----------|--------|
| 5 stars | 1.20× | Earn merets 20% faster |
| 4 stars | 1.00× | Standard rate |
| 3 stars | 0.70× | 30% penalty |
| 2 stars | 0.40× | 60% penalty |
| 1 star | 0.20× | 80% penalty |

## Testing Checklist

- [ ] Run `ADD_EXPH_FIELD.sql` in Supabase
- [ ] Run `SET_CONSISTENT_USER_STATS.sql` to set test user stats
- [ ] Pull latest code and restart app
- [ ] Verify progress bar shows merets (not XP)
- [ ] Verify EXPH displays correctly (e.g., "43.6h")
- [ ] Verify Total Earned doesn't wrap
- [ ] Complete a task and verify EXPH increments
- [ ] Verify progress bar updates after task approval

## Database Migration Steps

1. **Add EXPH field and update function:**
   ```sql
   -- Run in Supabase SQL Editor
   \i ADD_EXPH_FIELD.sql
   ```

2. **Set consistent test data:**
   ```sql
   -- Run in Supabase SQL Editor
   \i SET_CONSISTENT_USER_STATS.sql
   ```

3. **Verify:**
   ```sql
   SELECT name, rep_score, lifetime_merets, experience_hours, 
          ROUND(lifetime_merets / experience_hours, 2) as avg_quality_multiplier
   FROM user_profiles
   WHERE name IN ('Onyx', 'Aveya');
   ```

Expected output:
- Onyx: Rep 22, 48 merets, 43.64 hours, 1.10 avg multiplier
- Aveya: Rep 24, 56 merets, 50.91 hours, 1.10 avg multiplier

## Files Changed

- `ADD_EXPH_FIELD.sql` - Database migration
- `lib/merets-helper.ts` - Progress calculation helpers
- `components/EarnerTaskMarket.tsx` - UI updates
- `app/(tabs)/index.tsx` - Data fetching updates
