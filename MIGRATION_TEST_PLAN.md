# Ments v1.5 Migration Test Plan

## Pre-Migration State ✅
- [x] Dev server running on port 8081
- [x] Database connection verified
- [x] Current schema confirmed (8 columns in user_profiles)
- [x] No new columns exist yet (clean slate)

## Migration Steps

### 1. Apply Migration in Supabase Dashboard
1. Open https://supabase.com/dashboard/project/bzogqqkptnbtnmpzvdca/sql/new
2. Copy contents of `supabase/migrations/20251226_ments_v15_final.sql`
3. Execute migration
4. Check for errors in output

### 2. Verify Database Changes

**Check user_profiles columns:**
```sql
select column_name, data_type 
from information_schema.columns 
where table_name = 'user_profiles' 
order by ordinal_position;
```

**Expected new columns:**
- handle (text)
- avatar_url (text)
- role (user_role enum)
- is_earner (boolean)
- is_provider (boolean)
- rep_score (integer, 0-100)
- rep_event_count (integer)
- merets_balance (numeric)
- lifetime_merets (numeric)
- updated_at (timestamptz)

**Check new tables exist:**
```sql
select table_name from information_schema.tables 
where table_schema = 'public' 
and table_name in ('meret_events', 'rep_events', 'earning_events', 'households', 'commitment_submissions', 'commitment_reviews');
```

**Check data backfilled:**
```sql
-- Should show handles generated from names
select id, name, handle, role, is_earner, is_provider, rep_score, merets_balance 
from user_profiles;

-- Should show default household created
select * from households;

-- Should show all users in household
select * from household_members;
```

### 3. Test App Functionality

**A. Check app loads without errors:**
- Open http://localhost:8081 in browser
- Check dev console for errors
- Look for any database query failures

**B. Test existing features still work:**
- [ ] Aveya dashboard loads
- [ ] Onyx dashboard loads  
- [ ] Parent dashboard loads
- [ ] Task Mall displays tasks
- [ ] Can view commitments
- [ ] No console errors related to missing columns

**C. Check for breaking changes:**
```bash
# Check if any existing code references old column names
grep -r "kid_id" app/ components/ lib/ --include="*.ts" --include="*.tsx"
grep -r "parent.*role" app/ components/ lib/ --include="*.ts" --include="*.tsx"
```

### 4. Test New Features (Optional)

**A. Rep score calculation:**
```sql
-- Create a test review
insert into commitment_reviews (commitment_id, reviewer_id, quality_stars, review_note)
values ('existing-commitment-id', 'parent-id', 5, 'Test review');

-- Check events created
select * from meret_events order by created_at desc limit 1;
select * from rep_events order by created_at desc limit 1;

-- Check cached values updated
select rep_score, rep_event_count, merets_balance from user_profiles where id = 'earner-id';
```

**B. View rep breakdown:**
```sql
select * from v_user_rep_breakdown;
```

## Rollback Plan (If Needed)

If migration fails or breaks app:

### Option 1: Revert in Supabase Dashboard
```sql
-- Drop new columns
alter table user_profiles 
drop column if exists handle,
drop column if exists avatar_url,
drop column if exists role,
drop column if exists is_earner,
drop column if exists is_provider,
drop column if exists rep_score,
drop column if exists rep_event_count,
drop column if exists merets_balance,
drop column if exists lifetime_merets,
drop column if exists updated_at;

-- Drop new tables
drop table if exists meret_events cascade;
drop table if exists rep_events cascade;
drop table if exists earning_events cascade;
drop table if exists households cascade;
drop table if exists household_members cascade;
drop table if exists commitment_submissions cascade;
drop table if exists commitment_reviews cascade;

-- Drop new types
drop type if exists user_role cascade;
```

### Option 2: Restore from backup
- Supabase keeps automatic backups
- Can restore to point-in-time before migration

## Success Criteria

- [x] Migration executes without errors
- [ ] All new columns exist with correct data types
- [ ] All new tables created successfully
- [ ] Existing data preserved (names, ages, levels, xp, earnings)
- [ ] Handles auto-generated from names
- [ ] Default household created with all users
- [ ] App loads without errors
- [ ] Existing features work (dashboards, task mall, commitments)
- [ ] No breaking changes to existing code
- [ ] Dev console clean (no database errors)

## Notes

- Migration is **additive only** - does not delete or rename existing columns
- All new columns have safe defaults
- Backfills are best-effort (handles from names, roles from existing role column)
- If `role` column already exists with 'parent'/'kid', it will be migrated to new enum
- Trigger only activates on new commitment_reviews (doesn't retroactively process old data)

---

**Status:** Ready to execute
**Risk Level:** Low (additive migration, preserves all existing data)
**Estimated Time:** 2-3 minutes
