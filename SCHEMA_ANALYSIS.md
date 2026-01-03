# Complete Schema Analysis for Approval Flow

## Database Schema (Verified from migrations)

### user_profiles
- `id` UUID PRIMARY KEY
- `merets_balance` NUMERIC(12,2) NOT NULL DEFAULT 0
- `lifetime_merets` NUMERIC(12,2) NOT NULL DEFAULT 0
- `rep_score` INT NOT NULL DEFAULT 50
- `rep_event_count` INT NOT NULL DEFAULT 0
- `total_tasks_completed` INT (added in later migration)
- `total_merets_earned` NUMERIC (need to verify precision)
- `xp` INT (need to verify)
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

### task_templates
- `id` UUID PRIMARY KEY
- `title` VARCHAR(200)
- `description` TEXT
- `skill_category` VARCHAR(50)
- `effort_minutes` INTEGER
- `base_pay_cents` INTEGER
- `difficulty_level` INTEGER CHECK (1-4)
- `base_merets` NUMERIC(8,2) NOT NULL DEFAULT 0  ← **KEY: Only 8 precision, 2 scale**
- `issuer_id` UUID
- `is_available_for_kids` BOOLEAN
- `created_at` TIMESTAMPTZ

### commitments
- `id` UUID PRIMARY KEY
- `user_id` UUID REFERENCES user_profiles(id)
- `task_template_id` UUID REFERENCES task_templates(id)
- `custom_title` VARCHAR(200)
- `custom_description` TEXT
- `skill_category` VARCHAR(50)
- `effort_minutes` INTEGER
- `pay_cents` INTEGER
- `status` VARCHAR(20) CHECK ('pending', 'approved', 'completed', 'rejected')
- `quality_rating` VARCHAR(10) CHECK ('miss', 'pass', 'perfect')
- `completed_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

### commitment_submissions
- `id` UUID PRIMARY KEY
- `commitment_id` UUID REFERENCES commitments(id)
- `submitted_by` UUID (user who submitted)
- `submission_status` TEXT ('pending_approval', 'approved', 'rejected')
- `evidence_urls` TEXT[] (photos)
- `submission_note` TEXT
- `quality_rating` INTEGER CHECK (1-5)
- `bonus_tip_cents` INTEGER DEFAULT 0
- `reviewer_notes` TEXT
- `reviewed_by` UUID REFERENCES user_profiles(id)
- `reviewed_at` TIMESTAMPTZ
- `submitted_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

## TypeScript Code Flow

### ReviewSubmissionModal.tsx
1. User selects rating (1-5 stars)
2. User optionally adds bonus tip (in dollars, converted to cents)
3. User optionally adds review notes
4. Calls `SupabaseService.approveSubmission()`

### SupabaseService.approveSubmission()
```typescript
approveSubmission(
  submissionId: string,
  rating: number,           // 1-5
  reviewerId: string,       // parent UUID
  reviewNotes?: string,
  tipCents?: number         // bonus in cents
)
```

Calls RPC function:
```typescript
supabase.rpc('approve_submission', {
  p_submission_id: submissionId,
  p_quality_rating: rating,
  p_reviewer_id: reviewerId,
  p_reviewer_notes: reviewNotes || null,
  p_bonus_tip_cents: tipCents || 0
})
```

## Current Problem: DECIMAL Overflow

### Root Cause Analysis
The overflow is happening because:

1. **Variable declarations** use `DECIMAL(10,2)` or `NUMERIC` without matching column precision
2. **Column precision mismatch**:
   - `user_profiles.merets_balance` = NUMERIC(12,2) - can hold up to 9,999,999,999.99
   - `task_templates.base_merets` = NUMERIC(8,2) - can hold up to 999,999.99
   - Function variables were DECIMAL(10,2) - can hold up to 99,999,999.99

3. **The overflow is NOT from the values** (all are 0.00 in test data)
4. **The overflow is from type conversion** when assigning to variables or doing arithmetic

### Critical Issue
Even with NUMERIC (no precision), the overflow persists. This suggests:
- The overflow is happening in an UPDATE statement
- Likely in a column that has restrictive precision we haven't identified
- Possibly `total_tasks_completed`, `total_merets_earned`, or `xp` columns

## Missing Information
Need to verify precision for:
- `user_profiles.total_tasks_completed`
- `user_profiles.total_merets_earned`  
- `user_profiles.xp`

These columns are updated in the approve_submission function but their precision is unknown.

## Solution Strategy
1. Query the exact precision of ALL columns being updated
2. Use matching NUMERIC types in function variables
3. Ensure all arithmetic operations maintain precision
4. Test incrementally to isolate which UPDATE causes overflow
