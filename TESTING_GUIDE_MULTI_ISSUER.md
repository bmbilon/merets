# Multi-Issuer Marketplace Testing Guide

**Date:** January 1, 2026  
**Purpose:** Step-by-step guide to test multi-issuer functionality  
**Prerequisites:** Database schema reviewed, code updates ready to apply

---

## Pre-Testing Setup

### Step 1: Fix Notification Triggers (CRITICAL)

**File:** `/home/ubuntu/merets/supabase/UPDATE_NOTIFICATION_TRIGGERS_V2.sql`

**Action:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `UPDATE_NOTIFICATION_TRIGGERS_V2.sql`
3. Execute the SQL
4. Verify no errors

**What This Fixes:**
- Removes incorrect `parent_id` column reference
- Uses `family_relationships` table to find parent
- Enables commitment creation to work

**Verification:**
```sql
-- Check trigger exists
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_notify_on_commitment';

-- Should return: trigger_notify_on_commitment | commitments | O (enabled)
```

---

### Step 2: Load Test Data

**File:** `/home/ubuntu/merets/supabase/TEST_DATA_MULTI_ISSUER.sql`

**Action:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `TEST_DATA_MULTI_ISSUER.sql`
3. Execute the SQL
4. Review summary output

**What This Creates:**
- 5 test users (1 parent, 1 kid, 3 external issuers)
- 4 family relationships (parent, teacher, neighbor, coach)
- 14 task templates (4 parent, 10 external)

**Verification:**
```sql
-- Check test users
SELECT id, name, role FROM user_profiles 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',  -- Sarah (parent)
  '22222222-2222-2222-2222-222222222222',  -- Tommy (kid)
  '33333333-3333-3333-3333-333333333333',  -- Ms. Rodriguez (teacher)
  '44444444-4444-4444-4444-444444444444',  -- Mr. Wilson (neighbor)
  '55555555-5555-5555-5555-555555555555'   -- Coach Davis (coach)
);

-- Check relationships
SELECT 
  i.name as issuer,
  e.name as earner,
  fr.relationship_type
FROM family_relationships fr
JOIN user_profiles i ON fr.issuer_id = i.id
JOIN user_profiles e ON fr.earner_id = e.id
WHERE e.id = '22222222-2222-2222-2222-222222222222';

-- Check tasks
SELECT 
  t.title,
  i.name as issuer,
  t.base_pay_cents / 100.0 as pay_dollars
FROM task_templates t
JOIN user_profiles i ON t.issuer_id = i.id
WHERE t.issuer_id IN (
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
ORDER BY i.name, t.title;
```

---

### Step 3: Apply Code Updates

**Files to Update:**
1. `/home/ubuntu/merets/app/(tabs)/index.tsx`
2. `/home/ubuntu/merets/lib/supabase-service.ts`
3. `/home/ubuntu/merets/lib/types.ts`
4. `/home/ubuntu/merets/components/ParentApprovalQueue.tsx`

**Reference:** See `CODE_UPDATES_MULTI_ISSUER.md` for exact code changes

**After Updates:**
```bash
# Restart Expo dev server
cd /home/ubuntu/merets
npm start
```

---

## Test Scenarios

### Scenario 1: Task Visibility (Relationship Filtering)

**Objective:** Verify kids only see tasks from issuers they have relationships with

**Steps:**
1. Login as Tommy (kid)
2. Navigate to Marketplace tab
3. Review visible tasks

**Expected Results:**
- ✅ Should see 14 tasks total:
  - 4 from Sarah Johnson (parent)
  - 3 from Ms. Emily Rodriguez (teacher)
  - 4 from Mr. Bob Wilson (neighbor)
  - 3 from Coach Mike Davis (coach)
- ✅ Each task should display issuer name
- ✅ External tasks should show "🔒 Requires Parent Approval" badge

**Verification Query:**
```sql
-- What Tommy should see
SELECT 
  t.title,
  i.name as issuer,
  fr.relationship_type,
  CASE 
    WHEN fr.relationship_type IN ('parent', 'guardian') THEN 'No Approval'
    ELSE 'Requires Approval'
  END as approval_status
FROM task_templates t
JOIN user_profiles i ON t.issuer_id = i.id
JOIN family_relationships fr ON t.issuer_id = fr.issuer_id
WHERE fr.earner_id = '22222222-2222-2222-2222-222222222222'
  AND t.is_available_for_kids = true
ORDER BY i.name, t.title;
```

**Fail Conditions:**
- ❌ Sees tasks from issuers with no relationship
- ❌ Doesn't see tasks from related issuers
- ❌ Issuer name not displayed
- ❌ Approval badge missing on external tasks

---

### Scenario 2: Parent Task Commitment (No Approval)

**Objective:** Verify parent tasks don't require approval

**Steps:**
1. Login as Tommy (kid)
2. Navigate to Marketplace
3. Select "Clean Your Room" (from Sarah Johnson)
4. Click "Commit to This Task"

**Expected Results:**
- ✅ Alert: "✅ Success! You've committed to this task. Time to get started!"
- ✅ Commitment created with status = 'accepted'
- ✅ `requires_parental_approval` = false
- ✅ `parental_approval_status` = 'not_required'
- ✅ No notification sent to parent for approval
- ✅ Task appears in "My Ments" tab immediately

**Verification Query:**
```sql
-- Check commitment details
SELECT 
  c.id,
  c.status,
  c.requires_parental_approval,
  c.parental_approval_status,
  t.title as task,
  i.name as issuer,
  e.name as earner
FROM commitments c
JOIN task_templates t ON c.task_template_id = t.id
JOIN user_profiles i ON c.issuer_id = i.id
JOIN user_profiles e ON c.user_id = e.id
WHERE c.user_id = '22222222-2222-2222-2222-222222222222'
ORDER BY c.created_at DESC
LIMIT 1;
```

**Fail Conditions:**
- ❌ Status is 'pending_approval' instead of 'accepted'
- ❌ `requires_parental_approval` is true
- ❌ Alert says "Approval Required"
- ❌ Task doesn't appear in "My Ments"

---

### Scenario 3: External Task Commitment (Requires Approval)

**Objective:** Verify external tasks require parental approval

**Steps:**
1. Login as Tommy (kid)
2. Navigate to Marketplace
3. Select "Grade Spelling Tests" (from Ms. Emily Rodriguez)
4. Click "Commit to This Task"

**Expected Results:**
- ✅ Alert: "⏳ Approval Required - This task is from Ms. Emily Rodriguez. Your parent/guardian will be notified to approve your commitment."
- ✅ Commitment created with status = 'pending_approval'
- ✅ `requires_parental_approval` = true
- ✅ `parental_approval_status` = 'pending'
- ✅ Notification sent to parent (Sarah)
- ✅ Task appears in "My Ments" with "Pending Approval" status
- ✅ Cannot submit work until approved

**Verification Query:**
```sql
-- Check commitment details
SELECT 
  c.id,
  c.status,
  c.requires_parental_approval,
  c.parental_approval_status,
  t.title as task,
  i.name as issuer,
  e.name as earner
FROM commitments c
JOIN task_templates t ON c.task_template_id = t.id
JOIN user_profiles i ON c.issuer_id = i.id
JOIN user_profiles e ON c.user_id = e.id
WHERE c.user_id = '22222222-2222-2222-2222-222222222222'
  AND c.requires_parental_approval = true
ORDER BY c.created_at DESC
LIMIT 1;

-- Check notification was created
SELECT 
  n.notification_type,
  n.title,
  n.message,
  n.read,
  r.name as recipient
FROM notifications n
JOIN user_profiles r ON n.recipient_id = r.id
WHERE n.notification_type = 'external_task_pending_approval'
ORDER BY n.created_at DESC
LIMIT 1;
```

**Fail Conditions:**
- ❌ Status is 'accepted' instead of 'pending_approval'
- ❌ `requires_parental_approval` is false
- ❌ Alert says "Success" instead of "Approval Required"
- ❌ No notification sent to parent
- ❌ Kid can submit work before approval

---

### Scenario 4: Parent Approves External Task

**Objective:** Verify parent can approve external task commitments

**Steps:**
1. Login as Sarah (parent)
2. Navigate to Dashboard or Approval Queue
3. See "🔒 External Task Approvals" section
4. Find Tommy's request for "Grade Spelling Tests"
5. Review details (issuer, pay, time)
6. Click "Approve"

**Expected Results:**
- ✅ External task approval card visible
- ✅ Shows: Task title, issuer name, earner name, pay, time
- ✅ Alert: "✅ Approved - The commitment has been approved. Your child can now proceed."
- ✅ Commitment status changes to 'accepted'
- ✅ `parental_approval_status` = 'approved'
- ✅ `parent_approver_id` = Sarah's ID
- ✅ Notification sent to Tommy
- ✅ Tommy can now proceed with task

**Verification Query:**
```sql
-- Check commitment was approved
SELECT 
  c.id,
  c.status,
  c.parental_approval_status,
  approver.name as approved_by,
  t.title as task,
  e.name as earner
FROM commitments c
JOIN task_templates t ON c.task_template_id = t.id
JOIN user_profiles e ON c.user_id = e.id
LEFT JOIN user_profiles approver ON c.parent_approver_id = approver.id
WHERE c.id = :commitment_id;

-- Check notification sent to kid
SELECT 
  n.notification_type,
  n.title,
  n.message,
  r.name as recipient
FROM notifications n
JOIN user_profiles r ON n.recipient_id = r.id
WHERE n.commitment_id = :commitment_id
  AND n.notification_type = 'external_task_approved'
ORDER BY n.created_at DESC
LIMIT 1;
```

**Fail Conditions:**
- ❌ Approval request not visible to parent
- ❌ Status doesn't change to 'accepted'
- ❌ `parent_approver_id` not set
- ❌ No notification sent to kid
- ❌ Kid still can't proceed with task

---

### Scenario 5: Parent Denies External Task

**Objective:** Verify parent can deny external task commitments

**Steps:**
1. Login as Tommy (kid)
2. Commit to "Mow Front and Back Lawn" (from Mr. Bob Wilson)
3. Logout, login as Sarah (parent)
4. Navigate to Approval Queue
5. Find Tommy's request for lawn mowing
6. Click "Deny"

**Expected Results:**
- ✅ Alert: "❌ Denied - The commitment has been denied."
- ✅ Commitment status changes to 'rejected'
- ✅ `parental_approval_status` = 'denied'
- ✅ `parent_approver_id` = Sarah's ID
- ✅ Notification sent to Tommy
- ✅ Task removed from Tommy's "My Ments" or marked as rejected
- ✅ Tommy can re-commit to the task if desired

**Verification Query:**
```sql
-- Check commitment was denied
SELECT 
  c.id,
  c.status,
  c.parental_approval_status,
  approver.name as denied_by,
  t.title as task,
  e.name as earner
FROM commitments c
JOIN task_templates t ON c.task_template_id = t.id
JOIN user_profiles e ON c.user_id = e.id
LEFT JOIN user_profiles approver ON c.parent_approver_id = approver.id
WHERE c.id = :commitment_id;

-- Check notification sent to kid
SELECT 
  n.notification_type,
  n.title,
  n.message,
  r.name as recipient
FROM notifications n
JOIN user_profiles r ON n.recipient_id = r.id
WHERE n.commitment_id = :commitment_id
  AND n.notification_type = 'external_task_denied'
ORDER BY n.created_at DESC
LIMIT 1;
```

**Fail Conditions:**
- ❌ Status doesn't change to 'rejected'
- ❌ No notification sent to kid
- ❌ Task still shows as "pending" in kid's view
- ❌ Kid can proceed with denied task

---

### Scenario 6: Multiple Issuers, Multiple Tasks

**Objective:** Verify system handles multiple commitments from different issuers

**Steps:**
1. Login as Tommy (kid)
2. Commit to tasks from each issuer:
   - "Wash the Car" (Sarah - parent)
   - "Organize Classroom Library" (Ms. Rodriguez - teacher)
   - "Walk Dog (Daily)" (Mr. Wilson - neighbor)
   - "Set Up Soccer Field" (Coach Davis - coach)
3. Check "My Ments" tab
4. Login as Sarah (parent)
5. Check Approval Queue

**Expected Results:**
- ✅ "Wash the Car" accepted immediately (parent task)
- ✅ Other 3 tasks pending approval
- ✅ Parent sees 3 approval requests
- ✅ Each request shows correct issuer
- ✅ Parent can approve/deny each independently
- ✅ Notifications sent appropriately

**Verification Query:**
```sql
-- Check all commitments
SELECT 
  c.id,
  t.title,
  i.name as issuer,
  c.status,
  c.requires_parental_approval,
  c.parental_approval_status
FROM commitments c
JOIN task_templates t ON c.task_template_id = t.id
JOIN user_profiles i ON c.issuer_id = i.id
WHERE c.user_id = '22222222-2222-2222-2222-222222222222'
ORDER BY c.created_at DESC;
```

**Fail Conditions:**
- ❌ All tasks require approval (including parent task)
- ❌ Parent doesn't see all approval requests
- ❌ Issuer names incorrect or missing
- ❌ Approving one affects others

---

## Edge Cases & Error Handling

### Edge Case 1: Kid with No Relationships

**Setup:**
```sql
-- Create kid with no relationships
INSERT INTO user_profiles (id, name, role, age) VALUES
  ('99999999-9999-9999-9999-999999999999', 'Orphan Kid', 'kid', 10);
```

**Expected:**
- ✅ Marketplace shows no tasks
- ✅ Message: "No tasks available. Ask your parent to connect with task issuers."

---

### Edge Case 2: Task from Deleted Issuer

**Setup:**
```sql
-- Soft delete issuer (set is_active = false if field exists)
-- Or delete relationship
DELETE FROM family_relationships 
WHERE issuer_id = '33333333-3333-3333-3333-333333333333'
  AND earner_id = '22222222-2222-2222-2222-222222222222';
```

**Expected:**
- ✅ Tasks from that issuer no longer visible
- ✅ Existing commitments remain but show "Issuer Unavailable"

---

### Edge Case 3: Multiple Parents

**Setup:**
```sql
-- Add second parent
INSERT INTO user_profiles (id, name, role) VALUES
  ('66666666-6666-6666-6666-666666666666', 'Dad Johnson', 'parent');

INSERT INTO family_relationships (issuer_id, earner_id, relationship_type, permission_level) VALUES
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'parent', 'full');
```

**Expected:**
- ✅ Tasks from both parents don't require approval
- ✅ Either parent can approve external tasks
- ✅ Both parents receive notifications

---

## Performance Testing

### Test 1: Large Number of Tasks

**Setup:**
```sql
-- Create 100 tasks from various issuers
-- (Script to generate bulk test data)
```

**Expected:**
- ✅ Marketplace loads in < 2 seconds
- ✅ Filtering by relationships is efficient
- ✅ No duplicate tasks shown

---

### Test 2: Large Number of Relationships

**Setup:**
```sql
-- Create 20 issuer relationships for one kid
```

**Expected:**
- ✅ Query performs well (< 1 second)
- ✅ All tasks from all issuers visible
- ✅ Approval logic still correct

---

## Regression Testing

### Verify Existing Functionality Still Works:

- [ ] Kid can commit to tasks
- [ ] Kid can submit work with photos
- [ ] Parent can approve/reject submissions
- [ ] XP and credits awarded correctly
- [ ] Notifications work for all types
- [ ] Dashboard stats accurate
- [ ] Leaderboard functional
- [ ] Task creation by parents works

---

## Rollback Plan

If critical issues found:

### Step 1: Revert Code Changes
```bash
cd /home/ubuntu/merets
git checkout app/(tabs)/index.tsx
git checkout lib/supabase-service.ts
git checkout lib/types.ts
git checkout components/ParentApprovalQueue.tsx
```

### Step 2: Remove Test Data
```sql
-- Delete test commitments
DELETE FROM commitments WHERE user_id = '22222222-2222-2222-2222-222222222222';

-- Delete test relationships (optional)
DELETE FROM family_relationships WHERE earner_id = '22222222-2222-2222-2222-222222222222';

-- Delete test users (optional)
DELETE FROM user_profiles WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);
```

### Step 3: Keep Trigger Fix
**DO NOT REVERT** the notification trigger fix - it fixes a bug regardless of multi-issuer feature.

---

## Success Criteria

**All scenarios pass:**
- ✅ Task visibility filtered correctly
- ✅ Parent tasks don't require approval
- ✅ External tasks require approval
- ✅ Parents can approve/deny
- ✅ Notifications work correctly
- ✅ No regressions in existing features

**Performance acceptable:**
- ✅ Marketplace loads < 2 seconds
- ✅ Commitment creation < 1 second
- ✅ Approval action < 1 second

**User experience smooth:**
- ✅ Clear feedback messages
- ✅ Issuer names visible
- ✅ Approval status clear
- ✅ No confusing states

---

## Post-Testing Actions

### If All Tests Pass:
1. ✅ Document any edge cases discovered
2. ✅ Update user guide with multi-issuer instructions
3. ✅ Create admin guide for adding new issuers
4. ✅ Plan Phase 2 features (issuer discovery, reputation, etc.)

### If Tests Fail:
1. ❌ Document failures in detail
2. ❌ Identify root cause
3. ❌ Fix issues
4. ❌ Re-test
5. ❌ Consider rollback if critical

---

## Next Phase Planning

**After successful testing, proceed to:**
1. ✅ Addictive gamification (confetti, animations, level-ups)
2. ✅ Social features (enhanced leaderboard, badges)
3. ✅ Issuer discovery (connection requests, directory)
4. ✅ Advanced approval workflows (conditional approval, time limits)
5. ✅ Issuer reputation system
6. ✅ Multi-household support

**Reference:** See `V1502_COMPLETION_ROADMAP.md` for detailed roadmap

---

## Support & Troubleshooting

### Common Issues:

**Issue:** Marketplace shows no tasks
- **Check:** Family relationships exist
- **Check:** Tasks have `is_available_for_kids = true`
- **Check:** Query includes correct user ID

**Issue:** All tasks require approval (including parent tasks)
- **Check:** Parent relationship exists with type 'parent' or 'guardian'
- **Check:** Logic checks relationship_type correctly
- **Check:** issuer_id matches in both tables

**Issue:** Notifications not appearing
- **Check:** Trigger was updated (run UPDATE_NOTIFICATION_TRIGGERS_V2.sql)
- **Check:** RLS policies allow notification inserts
- **Check:** Recipient_id is correct

**Issue:** Commitment creation fails
- **Check:** All required fields provided
- **Check:** Foreign keys valid
- **Check:** RLS policies allow insert

---

## Conclusion

This testing guide provides comprehensive coverage of the multi-issuer marketplace functionality. Follow each scenario step-by-step to ensure the system works as designed.

**Remember:** The schema is solid. The implementation is straightforward. The testing is thorough. Success is achievable.

Good luck! 🚀
