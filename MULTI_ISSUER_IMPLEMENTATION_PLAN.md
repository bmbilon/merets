# Multi-Issuer Marketplace Implementation Plan

**Date:** January 1, 2026  
**Status:** Ready to Implement  
**Priority:** High (Blocker for Phase 2)

---

## Overview

This document outlines the specific code changes needed to enable the multi-issuer marketplace with parental approval workflow. The database schema is already in place; we just need to wire up the application logic.

---

## Phase 1: Fix Critical Blocker (Notification Triggers)

### 🚨 **IMMEDIATE: Run SQL Migration**

**File:** `/home/ubuntu/merets/supabase/UPDATE_NOTIFICATION_TRIGGERS_V2.sql`

**Action Required:**
1. Open Supabase SQL Editor
2. Copy contents of `UPDATE_NOTIFICATION_TRIGGERS_V2.sql`
3. Execute the SQL
4. Verify triggers are updated

**What This Fixes:**
- Removes `parent_id` column reference (doesn't exist)
- Uses `family_relationships` table to find parent
- Enables commitment creation to work again

**Test After:**
```typescript
// Should work without errors
await createCommitment(kidUserId, taskTemplateId);
```

---

## Phase 2: Implement Task Visibility Filtering

### File: `/home/ubuntu/merets/app/(tabs)/index.tsx`

**Current Problem:**
```typescript
// Shows ALL tasks to ALL kids (no relationship filtering)
const { data: tasks } = await supabase
  .from('task_templates')
  .select('*')
  .eq('is_available_for_kids', true);
```

**Solution:**
```typescript
// Only show tasks from issuers the kid has a relationship with
const { data: tasks, error } = await supabase
  .from('task_templates')
  .select(`
    *,
    issuer:user_profiles!task_templates_issuer_id_fkey(
      id,
      name,
      role
    )
  `)
  .eq('is_available_for_kids', true)
  .in('issuer_id', (
    // Subquery: Get all issuer IDs this kid has relationships with
    supabase
      .from('family_relationships')
      .select('issuer_id')
      .eq('earner_id', currentUser.id)
  ))
  .order('created_at', { ascending: false });
```

**Alternative (More Explicit):**
```typescript
// Step 1: Get all issuer IDs the kid has relationships with
const { data: relationships } = await supabase
  .from('family_relationships')
  .select('issuer_id')
  .eq('earner_id', currentUser.id);

const issuerIds = relationships?.map(r => r.issuer_id) || [];

// Step 2: Fetch tasks from those issuers
const { data: tasks } = await supabase
  .from('task_templates')
  .select(`
    *,
    issuer:user_profiles!task_templates_issuer_id_fkey(
      id,
      name,
      role
    )
  `)
  .eq('is_available_for_kids', true)
  .in('issuer_id', issuerIds)
  .order('created_at', { ascending: false });
```

**UI Enhancement:**
Add issuer badge to task cards:
```typescript
<View style={styles.issuerBadge}>
  <Text style={styles.issuerText}>
    {task.issuer.name}
  </Text>
  {isExternalIssuer && (
    <Text style={styles.externalBadge}>Requires Parent Approval</Text>
  )}
</View>
```

---

## Phase 3: Implement External Task Detection

### File: `/home/ubuntu/merets/app/(tabs)/index.tsx`

**Current Problem:**
When kid commits to task, `requires_parental_approval` is not set correctly.

**Solution:**
Add logic to determine if task is external:

```typescript
async function handleCommitToTask(task: TaskTemplate) {
  try {
    // Step 1: Check if issuer is the kid's parent/guardian
    const { data: parentRelationship } = await supabase
      .from('family_relationships')
      .select('id, relationship_type')
      .eq('issuer_id', task.issuer_id)
      .eq('earner_id', currentUser.id)
      .in('relationship_type', ['parent', 'guardian'])
      .maybeSingle();

    const isParentTask = !!parentRelationship;
    const requiresApproval = !isParentTask;

    // Step 2: Create commitment with appropriate approval flags
    const { data: commitment, error } = await supabase
      .from('commitments')
      .insert({
        user_id: currentUser.id,
        task_template_id: task.id,
        issuer_id: task.issuer_id,
        skill_category: task.skill_category,
        effort_minutes: task.effort_minutes,
        pay_cents: task.base_pay_cents,
        status: requiresApproval ? 'pending_approval' : 'accepted',
        requires_parental_approval: requiresApproval,
        parental_approval_status: requiresApproval ? 'pending' : 'not_required',
      })
      .select()
      .single();

    if (error) throw error;

    // Step 3: Show appropriate feedback
    if (requiresApproval) {
      Alert.alert(
        'Approval Required',
        'This task is from an external issuer. Your parent/guardian will be notified to approve your commitment.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Success!',
        'You've committed to this task. Time to get started!',
        [{ text: 'Let\'s Go!' }]
      );
    }

    // Refresh data
    fetchTasks();
    
  } catch (error) {
    console.error('Error committing to task:', error);
    Alert.alert('Error', 'Failed to commit to task. Please try again.');
  }
}
```

---

## Phase 4: Extend Parent Approval Queue

### File: `/home/ubuntu/merets/components/ParentApprovalQueue.tsx`

**Current State:**
- Shows work submissions for approval
- Does not show external task commitment approvals

**Enhancement Needed:**
Add a new tab or section for "External Task Approvals"

```typescript
// Add to existing query
const { data: externalTaskApprovals } = await supabase
  .from('commitments')
  .select(`
    *,
    task:task_templates!commitments_task_template_id_fkey(
      title,
      description,
      skill_category,
      effort_minutes,
      base_pay_cents
    ),
    earner:user_profiles!commitments_user_id_fkey(
      id,
      name,
      avatar_url
    ),
    issuer:user_profiles!commitments_issuer_id_fkey(
      id,
      name
    )
  `)
  .eq('requires_parental_approval', true)
  .eq('parental_approval_status', 'pending')
  .order('created_at', { ascending: false });
```

**UI Component:**
```typescript
function ExternalTaskApprovalCard({ commitment }) {
  const handleApprove = async () => {
    const { error } = await supabase
      .from('commitments')
      .update({
        parental_approval_status: 'approved',
        parent_approver_id: currentUser.id,
        status: 'accepted',
      })
      .eq('id', commitment.id);

    if (!error) {
      Alert.alert('Approved', `${commitment.earner.name} can now proceed with this task.`);
      refresh();
    }
  };

  const handleDeny = async () => {
    const { error } = await supabase
      .from('commitments')
      .update({
        parental_approval_status: 'denied',
        parent_approver_id: currentUser.id,
        status: 'rejected',
      })
      .eq('id', commitment.id);

    if (!error) {
      Alert.alert('Denied', 'The commitment has been denied.');
      refresh();
    }
  };

  return (
    <Card>
      <Card.Content>
        <Text variant="titleMedium">{commitment.task.title}</Text>
        <Text variant="bodySmall">Requested by: {commitment.earner.name}</Text>
        <Text variant="bodySmall">Issuer: {commitment.issuer.name}</Text>
        <Text variant="bodySmall">Pay: ${(commitment.pay_cents / 100).toFixed(2)}</Text>
        <Text variant="bodySmall">Time: {commitment.effort_minutes} min</Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={handleDeny} mode="outlined">Deny</Button>
        <Button onPress={handleApprove} mode="contained">Approve</Button>
      </Card.Actions>
    </Card>
  );
}
```

---

## Phase 5: Update Notification Inbox

### File: `/home/ubuntu/merets/components/NotificationInbox.tsx`

**Enhancement:**
Ensure external task approval notifications have proper action buttons.

**Check Notification Types:**
```typescript
case 'external_task_pending_approval':
  return (
    <Button 
      mode="contained" 
      onPress={() => navigateToApprovalQueue(notification.commitment_id)}
    >
      Review Request
    </Button>
  );

case 'external_task_approved':
  return (
    <Button 
      mode="outlined" 
      onPress={() => navigateToCommitment(notification.commitment_id)}
    >
      View Task
    </Button>
  );

case 'external_task_denied':
  return (
    <Text style={styles.deniedText}>
      Your parent/guardian denied this commitment request.
    </Text>
  );
```

---

## Phase 6: Create Test Data

### File: `/home/ubuntu/merets/supabase/TEST_DATA_MULTI_ISSUER.sql`

**Purpose:** Create test scenarios for multi-issuer marketplace

```sql
-- Create test users
INSERT INTO user_profiles (id, name, role, age) VALUES
  ('parent-001', 'Mom Smith', 'parent', 42),
  ('kid-001', 'Tommy Smith', 'kid', 12),
  ('teacher-001', 'Ms. Johnson', 'parent', 35),  -- External issuer
  ('neighbor-001', 'Mr. Wilson', 'parent', 58);  -- External issuer

-- Create family relationships
INSERT INTO family_relationships (issuer_id, earner_id, relationship_type, permission_level) VALUES
  ('parent-001', 'kid-001', 'parent', 'full'),           -- Mom is Tommy's parent
  ('teacher-001', 'kid-001', 'teacher', 'approve_only'), -- Teacher relationship
  ('neighbor-001', 'kid-001', 'other', 'approve_only');  -- Neighbor relationship

-- Create tasks from different issuers
INSERT INTO task_templates (
  id, title, description, skill_category, effort_minutes, 
  base_pay_cents, difficulty_level, issuer_id, is_available_for_kids
) VALUES
  -- Parent tasks (no approval needed)
  ('task-parent-001', 'Clean Your Room', 'Vacuum, dust, organize', 'Household', 30, 500, 1, 'parent-001', true),
  ('task-parent-002', 'Wash the Car', 'Soap, rinse, dry', 'Outdoor', 45, 1000, 2, 'parent-001', true),
  
  -- Teacher tasks (requires approval)
  ('task-teacher-001', 'Grade Papers', 'Help grade spelling tests', 'Academic', 60, 1500, 2, 'teacher-001', true),
  ('task-teacher-002', 'Organize Classroom', 'Arrange desks and supplies', 'Organization', 90, 2000, 3, 'teacher-001', true),
  
  -- Neighbor tasks (requires approval)
  ('task-neighbor-001', 'Mow Lawn', 'Front and back yard', 'Outdoor', 60, 2500, 3, 'neighbor-001', true),
  ('task-neighbor-002', 'Walk Dog', 'Daily walk around block', 'Pet Care', 20, 500, 1, 'neighbor-001', true);
```

---

## Testing Checklist

### Scenario 1: Parent Task (No Approval)
- [ ] Login as Tommy (kid-001)
- [ ] See "Clean Your Room" in marketplace
- [ ] Commit to task
- [ ] Commitment status = 'accepted' immediately
- [ ] No approval notification sent to parent
- [ ] Can proceed to complete task

### Scenario 2: External Task (Requires Approval)
- [ ] Login as Tommy (kid-001)
- [ ] See "Grade Papers" from Ms. Johnson
- [ ] Task card shows "Requires Parent Approval" badge
- [ ] Commit to task
- [ ] Commitment status = 'pending_approval'
- [ ] Alert: "Your parent will be notified"
- [ ] Cannot proceed until approved

### Scenario 3: Parent Approval Flow
- [ ] Login as Mom (parent-001)
- [ ] See notification: "Tommy wants to commit to external task"
- [ ] Navigate to approval queue
- [ ] See external task approval card
- [ ] View task details (issuer, pay, time)
- [ ] Click "Approve"
- [ ] Commitment status changes to 'accepted'
- [ ] Tommy receives notification: "Your commitment was approved"

### Scenario 4: Parent Denial Flow
- [ ] Login as Mom (parent-001)
- [ ] See external task approval request
- [ ] Click "Deny"
- [ ] Commitment status changes to 'rejected'
- [ ] Tommy receives notification: "Your commitment was denied"
- [ ] Task remains available in marketplace

### Scenario 5: Task Visibility
- [ ] Login as Tommy (kid-001)
- [ ] Should see tasks from: Mom, Ms. Johnson, Mr. Wilson
- [ ] Should NOT see tasks from issuers with no relationship
- [ ] Verify issuer name displayed on each task card

---

## Rollout Plan

### Step 1: Fix Blocker (Day 1)
- ✅ Run `UPDATE_NOTIFICATION_TRIGGERS_V2.sql`
- ✅ Test commitment creation works

### Step 2: Implement Core Logic (Day 1-2)
- ✅ Update marketplace query (task visibility filtering)
- ✅ Add external task detection (commitment creation)
- ✅ Test with parent-only issuers

### Step 3: Extend Parent UI (Day 2)
- ✅ Add external task approval section to ParentApprovalQueue
- ✅ Test approval/denial flow
- ✅ Verify notifications work

### Step 4: Polish & Test (Day 3)
- ✅ Add issuer badges to task cards
- ✅ Add "Requires Approval" indicators
- ✅ Create test data for multi-issuer scenarios
- ✅ Run full test suite

### Step 5: Documentation (Day 3)
- ✅ Update README with multi-issuer setup instructions
- ✅ Document issuer onboarding process
- ✅ Create admin guide for adding new issuers

---

## Future Enhancements (Post-MVP)

### 1. Issuer Connection Requests
- Kids can request to connect with new issuers
- Parent must approve new connections
- Issuer directory/search

### 2. Task Visibility Controls
- Private tasks (specific earners only)
- Family tasks (all family members)
- Public tasks (any connected earner)

### 3. Issuer Reputation
- Earners rate issuers after task completion
- Track approval speed, fairness, clarity
- Display reputation scores

### 4. Multi-Household Support
- Kids belong to multiple households
- Cross-household task sharing
- Separate wallets per household

---

## Summary

**Current Status:** ✅ Schema is ready, application logic needs implementation

**Immediate Actions:**
1. Run notification trigger fix SQL
2. Update marketplace query to filter by relationships
3. Add external task detection to commitment creation
4. Extend parent approval queue for external tasks

**Timeline:** 2-3 days for full implementation and testing

**Risk Level:** Low (schema is solid, just wiring up logic)

The multi-issuer marketplace is architecturally sound and ready to be activated with the changes outlined above.
