# Schema Analysis: Multi-Issuer Marketplace Support

**Date:** January 1, 2026  
**Purpose:** Comprehensive review of database schema to ensure proper support for multi-issuer marketplace with parental approval workflow

---

## Executive Summary

### ✅ **GOOD NEWS: Core Multi-Issuer Architecture is Already in Place**

The schema is **well-designed** for multi-issuer marketplace functionality. The fundamental relationships and data structures needed are present. However, there are **critical gaps and redundancies** that need to be addressed before moving forward.

---

## Current Architecture Analysis

### 1. **Multi-Issuer Support: ✅ PRESENT**

#### Key Tables Supporting Multi-Issuer Model:

**`task_templates` table:**
- ✅ Has `issuer_id` column (references `user_profiles.id`)
- ✅ Any user can be an issuer (not limited to parents)
- ✅ Tasks are associated with their creator/issuer

**`commitments` table:**
- ✅ Has `issuer_id` column (tracks who issued the task)
- ✅ Has `user_id` column (tracks who committed to the task - the earner/kid)
- ✅ Has `requires_parental_approval` boolean flag
- ✅ Has `parental_approval_status` enum: 'not_required', 'pending', 'approved', 'denied'
- ✅ Has `parent_approver_id` to track which parent approved

**`family_relationships` table:**
- ✅ Links issuers to earners with relationship types
- ✅ Supports multiple relationship types: parent, guardian, grandparent, teacher, coach, mentor, etc.
- ✅ Has `permission_level` field: 'full', 'approve_only', 'review_only', 'view_only'
- ✅ Enables flexible authorization model

**Verdict:** ✅ **The core multi-issuer architecture is solid and ready to use.**

---

### 2. **Parental Approval Workflow: ✅ PRESENT**

The schema has built-in support for parental approval of external tasks:

**In `commitments` table:**
```sql
requires_parental_approval boolean DEFAULT false
parental_approval_status text DEFAULT 'not_required'::text 
  CHECK (parental_approval_status = ANY (ARRAY['not_required', 'pending', 'approved', 'denied']))
parent_approver_id uuid (FK to user_profiles)
parent_approval_notes text
```

**Logic Flow:**
1. Kid browses tasks from any issuer
2. Kid commits to external task (issuer_id ≠ parent_id)
3. System sets `requires_parental_approval = true` and `parental_approval_status = 'pending'`
4. Parent receives notification
5. Parent approves/denies → updates `parental_approval_status` and `parent_approver_id`
6. If approved, kid can proceed; if denied, commitment is blocked

**Verdict:** ✅ **Parental approval workflow is architecturally sound.**

---

## Critical Issues Identified

### 🚨 **Issue #1: Table Redundancy - `issuers` Table is Unnecessary**

**Problem:**
- There's a separate `issuers` table that duplicates information already in `user_profiles`
- The `issuers` table has a `user_profile_id` FK, creating a 1:1 relationship
- This creates confusion: Is an issuer a separate entity or just a user with a role?

**Current State:**
```sql
CREATE TABLE public.issuers (
  id uuid PRIMARY KEY,
  user_profile_id uuid UNIQUE,  -- 1:1 relationship with user_profiles
  name text NOT NULL,
  email text,
  issuer_type text,  -- parent, teacher, coach, etc.
  organization_name text,
  can_create_tasks boolean DEFAULT true,
  can_approve_commitments boolean DEFAULT true,
  ...
)
```

**Why This is Problematic:**
1. **Data Duplication:** Name, email, type info duplicated between `issuers` and `user_profiles`
2. **Referential Confusion:** `task_templates.issuer_id` and `commitments.issuer_id` reference `user_profiles.id`, NOT `issuers.id`
3. **Unnecessary Complexity:** The `issuers` table adds no value since all issuer functionality can be handled via `user_profiles` + `family_relationships`

**Recommendation:** 
- ✅ **Keep using `user_profiles` for all issuer references (already implemented)**
- ⚠️ **Deprecate or remove the `issuers` table** (it's not being used in the current codebase)
- ✅ **Use `family_relationships` table to define issuer-earner relationships and permissions**

---

### 🚨 **Issue #2: Missing Issuer Discovery/Visibility Logic**

**Problem:**
The schema doesn't have a clear way to determine **which tasks should be visible to which earners**.

**Current Questions:**
1. Should kids see ALL tasks from ALL issuers?
2. Should kids only see tasks from issuers they have a relationship with?
3. Should there be an "approval" process for kids to connect with new issuers?
4. How do we handle task visibility for "public" vs "family-only" tasks?

**Missing Table/Logic:**
We need a way to define **issuer-earner connections** and **task visibility rules**.

**Proposed Solution:**

#### Option A: Use `family_relationships` as the gatekeeper
- Kids can only see tasks from issuers they have a relationship with in `family_relationships`
- To add a new issuer, parent must create a relationship record
- Query logic: 
  ```sql
  SELECT t.* FROM task_templates t
  INNER JOIN family_relationships fr ON t.issuer_id = fr.issuer_id
  WHERE fr.earner_id = :kid_id
  ```

#### Option B: Create `issuer_connections` table
```sql
CREATE TABLE issuer_connections (
  id uuid PRIMARY KEY,
  issuer_id uuid REFERENCES user_profiles(id),
  earner_id uuid REFERENCES user_profiles(id),
  connection_status text CHECK (connection_status IN ('pending', 'active', 'blocked')),
  requested_by uuid REFERENCES user_profiles(id),  -- who initiated
  approved_by uuid REFERENCES user_profiles(id),   -- parent who approved
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Recommendation:**
- ✅ **Use Option A (family_relationships) for MVP/demo** since it's already built
- 📋 **Add Option B later** for more granular control when expanding beyond family

---

### 🚨 **Issue #3: Task Visibility Query Not Implemented**

**Problem:**
The marketplace query in `app/(tabs)/index.tsx` currently fetches ALL tasks without filtering by issuer-earner relationships.

**Current Query:**
```typescript
const { data: tasks } = await supabase
  .from('task_templates')
  .select('*')
  .eq('is_available_for_kids', true)
  .order('created_at', { ascending: false });
```

**What's Missing:**
- No filtering by `family_relationships`
- Kids see tasks from issuers they have no connection to
- No distinction between "my family's tasks" vs "external tasks"

**Recommended Fix:**
```typescript
// Fetch tasks from issuers the kid has a relationship with
const { data: tasks } = await supabase
  .from('task_templates')
  .select(`
    *,
    issuer:user_profiles!task_templates_issuer_id_fkey(id, name, role),
    family_relationship:family_relationships!inner(
      relationship_type,
      permission_level
    )
  `)
  .eq('is_available_for_kids', true)
  .eq('family_relationships.earner_id', currentUserId)
  .order('created_at', { ascending: false });
```

---

### 🚨 **Issue #4: Missing Logic to Determine "External Task"**

**Problem:**
When a kid commits to a task, the system needs to determine:
- Is this task from my parent/guardian? → No approval needed
- Is this task from an external issuer? → Requires parental approval

**Current State:**
- `commitments.requires_parental_approval` exists but is not being set automatically
- No trigger or application logic to determine this

**Recommended Solution:**

#### Option A: Application Logic (Recommended for MVP)
In the commitment creation function:
```typescript
async function createCommitment(userId: string, taskTemplateId: string) {
  // 1. Get the task issuer
  const task = await getTaskTemplate(taskTemplateId);
  
  // 2. Check if issuer is the kid's parent
  const isParentTask = await supabase
    .from('family_relationships')
    .select('id')
    .eq('issuer_id', task.issuer_id)
    .eq('earner_id', userId)
    .in('relationship_type', ['parent', 'guardian'])
    .single();
  
  // 3. Set approval requirements
  const requiresApproval = !isParentTask;
  
  // 4. Create commitment
  await supabase.from('commitments').insert({
    user_id: userId,
    task_template_id: taskTemplateId,
    issuer_id: task.issuer_id,
    requires_parental_approval: requiresApproval,
    parental_approval_status: requiresApproval ? 'pending' : 'not_required',
    status: requiresApproval ? 'pending_approval' : 'accepted'
  });
}
```

#### Option B: Database Trigger
Create a trigger that automatically sets `requires_parental_approval` based on issuer relationship.

**Recommendation:** ✅ **Use Option A (application logic) for clarity and debugging**

---

## Schema Recommendations

### Immediate Actions (Before Next Phase):

#### 1. ✅ **Clarify Issuer Model**
- **Decision:** Use `user_profiles` as the single source of truth for issuers
- **Action:** Document that any user can be an issuer (role doesn't matter)
- **Action:** Deprecate `issuers` table (or document its future purpose if needed)

#### 2. ✅ **Implement Task Visibility Filtering**
- **Action:** Update marketplace query to filter by `family_relationships`
- **Action:** Only show tasks from issuers the kid has a relationship with
- **File:** `/home/ubuntu/merets/app/(tabs)/index.tsx`

#### 3. ✅ **Implement External Task Detection**
- **Action:** Add logic to determine if task requires parental approval
- **Action:** Set `requires_parental_approval` and `parental_approval_status` on commitment creation
- **File:** `/home/ubuntu/merets/app/(tabs)/index.tsx` (commitment creation function)

#### 4. ✅ **Add Parent Approval UI**
- **Action:** Create parent view to approve/deny external task commitments
- **Action:** Filter notifications by `notification_type = 'external_task_pending_approval'`
- **File:** `/home/ubuntu/merets/components/ParentApprovalQueue.tsx` (extend existing)

#### 5. ✅ **Fix Notification Trigger (Already in Progress)**
- **Action:** Run `UPDATE_NOTIFICATION_TRIGGERS_V2.sql` to fix parent lookup
- **File:** `/home/ubuntu/merets/supabase/UPDATE_NOTIFICATION_TRIGGERS_V2.sql`

---

## Future Enhancements (Post-MVP):

### 1. **Issuer Discovery & Connection Requests**
- Allow kids to request connections to new issuers
- Parent approval workflow for new issuer connections
- Public issuer directory (teachers, coaches, neighbors)

### 2. **Task Visibility Controls**
- `task_templates.visibility` field: 'private', 'family', 'public'
- Private: Only specific earners can see
- Family: All family members can see
- Public: Any connected earner can see

### 3. **Issuer Reputation System**
- Track issuer ratings from earners
- Quality of task descriptions
- Timeliness of approvals
- Fairness of payments

### 4. **Multi-Household Support**
- `households` table is already present but not fully utilized
- Enable kids to belong to multiple households
- Cross-household task sharing

---

## Testing Checklist

### For Current Demo (Parent-Only Issuers):

- [ ] Parent creates task → `issuer_id` is set to parent's `user_profiles.id`
- [ ] Kid sees task in marketplace (filtered by `family_relationships`)
- [ ] Kid commits to task → `issuer_id` matches parent, so `requires_parental_approval = false`
- [ ] Commitment status goes directly to `accepted`
- [ ] Kid can proceed to complete task without waiting for approval

### For Future Multi-Issuer:

- [ ] Create external issuer (teacher, neighbor, etc.)
- [ ] Create `family_relationships` record linking issuer to kid
- [ ] External issuer creates task
- [ ] Kid sees external task in marketplace
- [ ] Kid commits to external task → `requires_parental_approval = true`
- [ ] Commitment status is `pending_approval`
- [ ] Parent receives notification
- [ ] Parent approves → status changes to `accepted`
- [ ] Kid can now proceed with task

---

## Conclusion

### ✅ **Schema is Ready for Multi-Issuer Marketplace**

The database schema has excellent foundational support for the multi-issuer model. The key relationships and approval workflows are already in place.

### 🔧 **Implementation Gaps to Address:**

1. **Query Logic:** Marketplace needs to filter tasks by `family_relationships`
2. **Approval Logic:** Commitment creation needs to detect external tasks and set approval flags
3. **UI Updates:** Parent approval queue needs to handle external task approvals
4. **Notification Fix:** Run the V2 trigger update to fix parent lookup

### 📋 **Recommended Next Steps:**

1. ✅ **Fix notification triggers** (run UPDATE_NOTIFICATION_TRIGGERS_V2.sql)
2. ✅ **Implement task visibility filtering** (update marketplace query)
3. ✅ **Implement external task detection** (update commitment creation)
4. ✅ **Test parent-only issuer flow** (current demo scenario)
5. ✅ **Document multi-issuer expansion plan** (for post-MVP)

The schema is solid. We just need to wire up the application logic to take full advantage of it.
