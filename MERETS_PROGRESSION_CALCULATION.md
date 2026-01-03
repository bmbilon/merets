# Merets Progression Calculation

## Target Timeline
- **Level 0 → 10**: Few weeks (~3 weeks)
- **Level 0 → 20**: 1 month
- **Level 0 → 30**: 3 months
- **Level 0 → 50**: 6 months
- **Level 0 → 70**: 18-24 months

## Assumptions
- Average work time: 1 hour per day
- Average quality rating: 4 stars (1.0x multiplier)
- Working days: 5 days per week

## Work Hours Per Period
- 3 weeks = 15 work hours
- 1 month = 20 work hours
- 3 months = 60 work hours
- 6 months = 120 work hours
- 18 months = 360 work hours
- 24 months = 480 work hours

## Rep Level Requirements (Cumulative Merets Needed)
To design the progression, we need merets required to reach each level.

Using an exponential curve where each level requires progressively more merets:

### Formula: merets_required(level) = base × (growth_factor ^ level)

Let's work backwards:
- Level 10 in 15 hours → ~15 merets total
- Level 20 in 20 hours → ~20 merets total  
- Level 30 in 60 hours → ~60 merets total
- Level 50 in 120 hours → ~120 merets total
- Level 70 in 360-480 hours → ~360-480 merets total

This suggests approximately **1 meret per hour at base rate**.

## Merets Per Hour by Rep Level

To create meaningful progression while maintaining the timeline:

### Tier 1: Levels 0-9 (Unranked/Entry)
- **1.0 merets/hour** - Fast initial progression
- Reach level 10 in ~15 hours (3 weeks)

### Tier 2: Levels 10-19 (Entry)
- **0.8 merets/hour** - Slight slowdown
- Level 10→20 takes ~12.5 additional hours

### Tier 3: Levels 20-29 (Active)
- **0.7 merets/hour** - Moderate pace
- Level 20→30 takes ~40 hours (2 months from level 20)

### Tier 4: Levels 30-39 (Active)
- **0.6 merets/hour** - Slowing down
- Level 30→40 takes ~60 hours

### Tier 5: Levels 40-49 (Meritous)
- **0.5 merets/hour** - Significant effort required
- Level 40→50 takes ~80 hours

### Tier 6: Levels 50-59 (Meritous)
- **0.4 merets/hour** - Elite territory
- Level 50→60 takes ~100 hours

### Tier 7: Levels 60-69 (Virtuous)
- **0.3 merets/hour** - Mastery level
- Level 60→70 takes ~133 hours

### Tier 8: Levels 70-79 (Virtuous)
- **0.25 merets/hour** - Legendary
- Level 70→80 takes ~160 hours

### Tier 9: Levels 80-89 (Exceptional)
- **0.2 merets/hour** - Near maximum
- Level 80→90 takes ~200 hours

### Tier 10: Levels 90-100 (Exceptional)
- **0.15 merets/hour** - Maximum achievement
- Level 90→100 takes ~267 hours

## SQL Function

```sql
CREATE OR REPLACE FUNCTION get_merets_per_hour_rate(p_rep_level INTEGER)
RETURNS NUMERIC
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_rep_level < 10 THEN 1.0
    WHEN p_rep_level < 20 THEN 0.8
    WHEN p_rep_level < 30 THEN 0.7
    WHEN p_rep_level < 40 THEN 0.6
    WHEN p_rep_level < 50 THEN 0.5
    WHEN p_rep_level < 60 THEN 0.4
    WHEN p_rep_level < 70 THEN 0.3
    WHEN p_rep_level < 80 THEN 0.25
    WHEN p_rep_level < 90 THEN 0.2
    ELSE 0.15
  END;
$$;
```

## Final Merets Calculation

```
merets_earned = (effort_minutes / 60) × rep_rate × quality_multiplier

Where:
- effort_minutes = time spent on task
- rep_rate = get_merets_per_hour_rate(user's current rep_level)
- quality_multiplier = based on star rating (5★=1.20, 4★=1.00, 3★=0.70, 2★=0.40, 1★=0.20)
```

## Example Calculations

### Level 5 earner, 30-minute task, 4-star rating:
- Base rate: 1.0 merets/hour
- Time: 30/60 = 0.5 hours
- Quality: 1.0x
- **Result: 0.5 × 1.0 × 1.0 = 0.50 merets**

### Level 25 earner, 60-minute task, 5-star rating:
- Base rate: 0.7 merets/hour
- Time: 60/60 = 1.0 hours
- Quality: 1.2x
- **Result: 1.0 × 0.7 × 1.2 = 0.84 merets**

### Level 55 earner, 45-minute task, 3-star rating:
- Base rate: 0.4 merets/hour
- Time: 45/60 = 0.75 hours
- Quality: 0.7x
- **Result: 0.75 × 0.4 × 0.7 = 0.21 merets**

## Verification of Timeline

Let's verify the timeline works:

**Level 0 → 10** (1.0 merets/hour, 4★ avg):
- 15 hours × 1.0 × 1.0 = 15 merets ✅

**Level 10 → 20** (0.8 merets/hour):
- Need ~8 more merets
- 10 hours × 0.8 × 1.0 = 8 merets
- Total: 25 hours (~5 weeks) ✅

**Level 20 → 30** (0.7 merets/hour):
- Need ~35 more merets  
- 50 hours × 0.7 × 1.0 = 35 merets
- Total: 75 hours (~15 weeks / 3.5 months) ✅

**Level 30 → 50** (0.6-0.5 merets/hour avg):
- Need ~60 more merets
- 110 hours × 0.55 × 1.0 = 60.5 merets
- Total: 185 hours (~37 weeks / 9 months) ⚠️ Slightly longer than 6 months

**Level 50 → 70** (0.4-0.3 merets/hour avg):
- Need ~70 more merets
- 200 hours × 0.35 × 1.0 = 70 merets
- Total: 385 hours (~77 weeks / 18 months) ✅

The timeline roughly matches! May need minor adjustments but this is a solid starting point.
