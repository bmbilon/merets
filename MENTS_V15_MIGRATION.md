# Ments v1.5 Migration Guide

## 🎉 Overview
This is an **ADDITIVE** migration that brings Merets, Rep, and the no-money earnings ledger to your app **without breaking anything**.

## What's New

### 1. **Merets** - Internal Currency
- Kids earn Merets for completing tasks (~1 Meret per hour of work)
- Quality multipliers: 5⭐ = 1.2x, 4⭐ = 1.0x, 3⭐ = 0.7x, ≤2⭐ = 0.4x
- Can be used later for marketplace purchases, unlocks, rewards
- Tracked in `user_profiles.merets_balance` and `ledger_events`

### 2. **Rep** - Reputation System
- 1-5 star rating (starts at 3.00 stars)
- Updated based on commitment outcomes:
  - Honored on time: +0.06
  - Honored late: +0.02
  - Low quality: -0.08
  - Failed: -0.12
- Softened averaging prevents whiplash (new events matter less as count grows)
- Tracked in `user_profiles.rep_stars` and `ledger_events`

### 3. **No-Money Ledger**
- Tracks cash "owed" → "paid" without handling real money
- Parents mark payments as completed off-platform
- Full audit trail in `ledger_events` table
- Query summary: `select * from v_kid_earnings_summary`

### 4. **Commitment Lifecycle**
New workflow: `proposed` → `accepted` → `in_progress` → `submitted` → `completed`/`failed`

When parent reviews:
- Kid submits via `commitment_submissions` (time spent, notes, evidence)
- Parent rates via `commitment_reviews` (1-5 stars, feedback)
- **Automatic trigger** creates 3 ledger events: Merets, Rep, Earnings (if applicable)
- Cached metrics auto-update on user profile

## Database Changes

### Enhanced Existing Tables

**user_profiles** (new columns):
```sql
handle text unique,              -- username (e.g., "aveya", "onyx")
avatar_url text,                 -- future profile pic
rep_stars numeric(3,2),          -- 1.00-5.00 reputation
rep_count int,                   -- # of rep events
merets_balance numeric(12,2),    -- current Merets
lifetime_merets numeric(12,2),   -- total ever earned
updated_at timestamptz          -- last profile update
```

**task_templates** (new column):
```sql
base_merets numeric(12,2)       -- Merets awarded (auto-calculated: minutes/60)
```

### New Tables

**households** - Family grouping
```sql
id, name, created_by, created_at
```

**household_members** - Who belongs to which family
```sql
household_id, profile_id, role (parent/kid/provider), is_admin
```

**commitment_submissions** - What kid claims they did
```sql
commitment_id, submitted_at, minutes_spent, submission_note, evidence_urls[]
```

**commitment_reviews** - Parent's rating
```sql
commitment_id, reviewer_id, quality_stars (1-5), review_note, reviewed_at
```

**ledger_events** - The heart of the economy! 💰
```sql
kind: 'earnings' | 'merets' | 'rep'
kid_id, actor_id, commitment_id
cash_cents, cash_status (for earnings)
merets_delta, merets_reason (for merets)
rep_delta, rep_reason (for rep)
meta jsonb (extra context)
```

## Preserved Existing Tables ✅
- `pay_rates` - Your pricing logic
- `task_priorities` - Parent urgency settings
- `task_assignments` - Task tracking
- `chat_messages` - Family communications
- `commitments` - All existing commitments migrated
- All views and functions continue to work!

## Migration Steps

### 1. Backup (Automatic)
The migration automatically creates backup tables with timestamp suffix.

### 2. Run Migration
```bash
# Copy the migration file content
# Paste into Supabase SQL Editor
# Run it!
```

### 3. Verify
```sql
-- Check new columns exist
select id, name, handle, rep_stars, merets_balance from user_profiles;

-- Check household created
select * from households;

-- Check members added
select * from household_members;

-- Check task merets
select id, title, effort_minutes, base_merets from task_templates limit 5;
```

### 4. Test the Flow

**As Parent:**
```sql
-- Create a review (triggers everything automatically!)
insert into commitment_reviews (commitment_id, reviewer_id, quality_stars, review_note)
values (
  'some-commitment-id',
  'parent-profile-id',
  5,
  'Perfect job! Dishes sparkled! ✨'
);

-- Check the magic happened
select * from ledger_events where commitment_id = 'some-commitment-id';
select * from user_profiles where id = 'kid-profile-id'; -- rep/merets updated!
```

## App Code Updates Needed

### Update TypeScript Types
Add to `lib/supabase.ts`:
```typescript
export interface UserProfile {
  // ... existing fields
  handle?: string
  avatar_url?: string
  rep_stars: number
  rep_count: number
  merets_balance: number
  lifetime_merets: number
  updated_at: string
}

export interface TaskTemplate {
  // ... existing fields
  base_merets: number
}

export interface CommitmentSubmission {
  id: string
  commitment_id: string
  submitted_at: string
  minutes_spent: number
  submission_note?: string
  evidence_urls?: string[]
}

export interface CommitmentReview {
  id: string
  commitment_id: string
  reviewer_id: string
  quality_stars: number
  review_note?: string
  reviewed_at: string
}

export interface LedgerEvent {
  id: string
  kind: 'earnings' | 'merets' | 'rep'
  household_id?: string
  kid_id?: string
  actor_id?: string
  commitment_id?: string
  cash_cents?: number
  cash_status?: 'owed' | 'approved' | 'paid' | 'reversed' | 'void'
  merets_delta?: number
  merets_reason?: string
  rep_delta?: number
  rep_reason?: string
  meta: any
  created_at: string
}
```

### Display Merets & Rep in UI
```typescript
// In kid dashboard
<View>
  <Text>⭐ Rep: {userProfile.rep_stars.toFixed(2)} stars</Text>
  <Text>💎 Merets: {userProfile.merets_balance.toFixed(1)}</Text>
  <Text>💰 Earnings: ${totalEarnings / 100}</Text>
</View>
```

### Create Review Flow (Parent)
```typescript
// When parent reviews completed task
async function submitReview(commitmentId: string, qualityStars: number, note: string) {
  // Insert review - triggers create ledger events automatically!
  const { error } = await supabase
    .from('commitment_reviews')
    .insert({
      commitment_id: commitmentId,
      reviewer_id: parentProfile.id,
      quality_stars: qualityStars,
      review_note: note
    })
  
  if (error) throw error
  
  // Refresh kid's profile to see updated rep/merets
  // (happens automatically via trigger)
}
```

## Culture & Terminology

### The Ments Lexicon
- **Ment** = Commitment (short & snappy)
- **Merets** = Internal currency (like "merits" but cooler, ~1 Meret per hour)
- **Rep** = Reputation stars (social proof, 1-5 scale)
- **Ledger** = The eternal record (blockchain vibes, but Postgres)
- **Seeker** = Person seeking tasks/earning Merets (neutral term, not "kid")
- **Provider** = Person posting tasks/providing opportunities (parent/adult/vendor)

### Gamification Hook
- Kids build Rep to unlock trust features
- Merets become spendable currency in marketplace
- Earnings track real-world $ but without payment complexity
- Parents see transparent audit trail

### Future Expansions
- **Trust Score**: High rep → instant-complete on micro-tasks
- **Merets Store**: Spend on perks, screen time, treats
- **Provider Network**: Vetted helpers can post marketplace gigs
- **Team Ments**: Multiple kids collaborate on one task
- **Recurring Ments**: Auto-post weekly chores

## Rollback Plan
If anything goes wrong:
```sql
-- Your backups are: user_profiles_backup_YYYYMMDD_HHMMSS
-- Restore if needed:
drop table if exists user_profiles cascade;
alter table user_profiles_backup_20251226_183000 rename to user_profiles;
```

## Support
The migration is idempotent - safe to run multiple times. It won't duplicate data thanks to `on conflict do nothing` and `where not exists` clauses.

---

**Built with ❤️ for families who commit to each other**
