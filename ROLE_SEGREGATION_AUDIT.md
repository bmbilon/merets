# Role Segregation Audit

**Date:** January 1, 2026  
**Purpose:** Audit current role-based access control and identify gaps before continuing development

---

## Current Implementation Status

### ✅ **What's Working:**

#### 1. **Role-Based Routing (index.tsx)**
- ✅ User selection screen on first launch
- ✅ Hardcoded users: "aveya", "onyx" (kids), "lauren", "brett" (parents)
- ✅ Kids route to `EarnerMarketplace`
- ✅ Parents route to `ParentDashboard`
- ✅ User switcher button available

#### 2. **Kid/Earner View (EarnerMarketplace)**
**Shows:**
- ✅ Browse tab: Marketplace of available tasks
- ✅ My Ments tab: Active commitments
- ✅ Stats tab: Dashboard with XP, earnings, leaderboard
- ✅ Inbox tab: Notifications

**Can Do:**
- ✅ View tasks
- ✅ Commit to tasks
- ✅ Submit work with photos
- ✅ View notifications

**Cannot See:**
- ✅ Task creation/editing (correctly hidden)
- ✅ Approval queue (correctly hidden)
- ✅ Financial summary (correctly hidden)

#### 3. **Parent View (ParentScreen)**
**Shows:**
- ✅ Approvals tab: Pending work submissions to review
- ✅ Tasks tab: Task management (create/edit tasks)
- ✅ Financial tab: Payment summary

**Can Do:**
- ✅ Review submitted work
- ✅ Approve/reject submissions
- ✅ Award XP and credits
- ✅ Create new tasks
- ✅ Edit existing tasks
- ✅ View financial summary

---

## ❌ **Critical Gaps Identified:**

### 1. **No Database-Driven Role System**
**Problem:** Roles are hardcoded by name in index.tsx  
**Impact:** Cannot scale, cannot add new users dynamically  
**Current Code:**
```typescript
case "aveya":
case "onyx":
  return <EarnerMarketplace ... />;
case "lauren":
case "brett":
  return <ParentDashboard ... />;
```

**Should Be:**
```typescript
const userProfile = await getUserProfile(selectedUserId);
if (userProfile.role === 'kid') {
  return <EarnerMarketplace ... />;
} else if (userProfile.role === 'parent') {
  return <ParentDashboard ... />;
}
```

**Database Support:** ✅ `user_profiles.role` column exists ('kid' or 'parent')

---

### 2. **Missing: External Task Approval Queue for Parents**
**Problem:** Parents can approve WORK submissions, but NOT external TASK COMMITMENTS  
**Impact:** Multi-issuer marketplace cannot function properly  

**Current State:**
- ✅ ParentApprovalQueue shows work submissions
- ❌ Does NOT show external task commitment approvals

**Needed:**
- Parent sees when kid commits to external task (teacher, neighbor, etc.)
- Parent can approve/deny the commitment BEFORE kid starts work
- Uses `commitments.requires_parental_approval` and `parental_approval_status`

**Reference:** Already documented in `CODE_UPDATES_MULTI_ISSUER.md`

---

### 3. **Missing: Issuer-Specific Views**
**Problem:** No dedicated "Issuer" role or view  
**Impact:** External issuers (teachers, neighbors) cannot manage their tasks or review submissions

**Current State:**
- Only "kid" and "parent" roles exist
- Parents can create tasks and review work
- External issuers have no interface

**Needed for Multi-Issuer:**
- Issuer can view their own tasks
- Issuer can see commitments to their tasks
- Issuer can review submissions for their tasks
- Issuer receives notifications

**Database Support:** 
- ✅ `task_templates.issuer_id` exists
- ✅ `commitments.issuer_id` exists
- ✅ `family_relationships` table supports multiple issuer types

**Question:** Should external issuers use the same "parent" role with limited permissions, or create a separate "issuer" role?

---

### 4. **Task Visibility Not Filtered by Relationships**
**Problem:** Kids see ALL tasks, not just from related issuers  
**Impact:** Kids see tasks from unrelated people  
**Status:** ❌ Not implemented (documented in multi-issuer plan)

**Current Query:**
```typescript
const { data: tasks } = await supabase
  .from('task_templates')
  .select('*')
  .order('skill_category');
```

**Should Be:**
```typescript
// Get issuer IDs kid has relationships with
const { data: relationships } = await supabase
  .from('family_relationships')
  .select('issuer_id')
  .eq('earner_id', kidId);

// Only show tasks from those issuers
const { data: tasks } = await supabase
  .from('task_templates')
  .select('*')
  .in('issuer_id', issuerIds);
```

---

### 5. **No Messaging System Between Parents and External Issuers**
**Problem:** No communication channel for coordination  
**Impact:** Parents cannot discuss tasks/commitments with external issuers  
**Status:** ❌ Not implemented (acknowledged as future feature)

**Database Support:**
- ✅ `chat_messages` table exists
- ✅ Supports message types including commitment-related messages

**Needed:**
- Parent can message external issuer about a commitment
- Issuer can message parent about a kid's work
- Notifications for new messages

---

## 🎯 **Role Architecture Requirements**

### **Role 1: Kid/Earner**
**Can See:**
- ✅ Marketplace (filtered by relationships)
- ✅ My commitments
- ✅ Stats/dashboard
- ✅ Notifications

**Can Do:**
- ✅ Browse tasks
- ✅ Commit to tasks (with parent approval if external)
- ✅ Submit work
- ✅ View rewards

**Cannot Do:**
- ✅ Create tasks
- ✅ Approve work
- ✅ Edit tasks
- ✅ See financial details

---

### **Role 2: Parent/Guardian**
**Can See:**
- ✅ Work submission approval queue
- ❌ External task commitment approval queue (MISSING)
- ✅ Task management panel
- ✅ Financial summary
- ✅ Notifications

**Can Do:**
- ✅ Create tasks for their kids
- ✅ Approve/reject work submissions
- ✅ Award XP and credits
- ❌ Approve/deny external task commitments (MISSING)
- ❌ Message external issuers (MISSING)

**Cannot Do:**
- ✅ Commit to tasks as a kid (correctly prevented)

---

### **Role 3: External Issuer (Teacher, Neighbor, Coach)**
**Status:** ❌ NOT IMPLEMENTED

**Should See:**
- Their own created tasks
- Commitments to their tasks
- Submissions for their tasks
- Notifications

**Should Do:**
- Create tasks for kids they have relationships with
- Review submissions for their tasks
- Award XP and credits
- Message parents about commitments

**Should NOT Do:**
- See tasks from other issuers
- Approve parental approval requests (that's parent's job)
- See kids they don't have relationships with

---

## 📋 **Implementation Priority**

### **CRITICAL (Must Fix Before Gamification):**

1. ✅ **Use Database Roles Instead of Hardcoded Names**
   - Read `user_profiles.role` from database
   - Route based on role, not name
   - Time: 30 minutes

2. ❌ **Add External Task Commitment Approval Queue**
   - Extend ParentApprovalQueue component
   - Show commitments with `requires_parental_approval = true`
   - Allow approve/deny actions
   - Time: 2 hours
   - Reference: `CODE_UPDATES_MULTI_ISSUER.md`

3. ❌ **Filter Task Visibility by Relationships**
   - Update marketplace query
   - Only show tasks from related issuers
   - Time: 1 hour
   - Reference: `CODE_UPDATES_MULTI_ISSUER.md`

### **HIGH (Needed for Multi-Issuer):**

4. ❌ **Implement External Task Detection**
   - Check if issuer is parent/guardian
   - Set `requires_parental_approval` flag
   - Time: 1 hour
   - Reference: `CODE_UPDATES_MULTI_ISSUER.md`

5. ❌ **Create Issuer View**
   - Decide: Separate role or permission-based parent role?
   - Build issuer dashboard
   - Show issuer's tasks and submissions
   - Time: 4-6 hours

### **MEDIUM (Post-MVP):**

6. ❌ **Messaging System**
   - Parent-to-issuer messaging
   - Use existing `chat_messages` table
   - Notification integration
   - Time: 6-8 hours

7. ❌ **Issuer Discovery/Connection Requests**
   - Kids request to connect with new issuers
   - Parents approve connections
   - Issuer directory
   - Time: 8-10 hours

---

## ✅ **What's Solid and Doesn't Need Changes:**

1. ✅ **Tab Navigation for Kids**
   - Browse, My Ments, Stats, Inbox
   - Clean separation of concerns

2. ✅ **Tab Navigation for Parents**
   - Approvals, Tasks, Financial
   - Appropriate admin tools

3. ✅ **Work Submission Flow**
   - Kids submit work
   - Parents review and approve
   - XP and credits awarded

4. ✅ **Task Creation Flow**
   - Parents create tasks
   - Tasks appear in marketplace
   - Proper database integration

5. ✅ **Notification System**
   - Database triggers
   - Notification types
   - Inbox display

---

## 🚨 **Critical Decision Points:**

### **Decision 1: External Issuer Role Model**

**Option A: Separate "Issuer" Role**
- Pros: Clear separation, dedicated UI
- Cons: More complex role management

**Option B: Use "Parent" Role with Permissions**
- Pros: Simpler, reuses existing UI
- Cons: Less clear distinction

**Recommendation:** Option B for MVP, Option A for future

---

### **Decision 2: When to Implement Multi-Issuer**

**Option A: Now (Before Gamification)**
- Pros: Solid foundation, no rework later
- Cons: Delays gamification features

**Option B: After Gamification**
- Pros: Faster to visible features
- Cons: May require refactoring later

**User's Preference:** Option A (correct choice)

---

## 📝 **Action Plan:**

### **Phase 1: Fix Critical Role Issues (4 hours)**
1. Use database roles instead of hardcoded names
2. Add external task commitment approval queue
3. Filter task visibility by relationships
4. Implement external task detection

### **Phase 2: Test Role Segregation (2 hours)**
1. Test as kid: Can only see kid features
2. Test as parent: Can see admin features
3. Test external task flow with approval
4. Verify no cross-role access

### **Phase 3: Document and Confirm (1 hour)**
1. Update architecture docs
2. Create role testing guide
3. Confirm readiness for gamification

**Total Time:** 7 hours

---

## ✅ **Sign-Off Criteria:**

Before proceeding to gamification, confirm:
- [ ] Kids see only kid features
- [ ] Parents see only parent features
- [ ] External task approvals work
- [ ] Task visibility filtered by relationships
- [ ] No role leakage or cross-access
- [ ] Database-driven role system
- [ ] All role-based flows tested

---

## 🎯 **Bottom Line:**

**Current State:** Role segregation is 70% complete. Kids and parents have separate views, but critical multi-issuer features are missing.

**Gaps:** External task approvals, relationship-based filtering, issuer views.

**Recommendation:** Fix critical gaps (4 hours) before gamification to avoid rework.

**User is correct:** Foundation must be solid before adding features.
