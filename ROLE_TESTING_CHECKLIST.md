# Role Segregation Testing Checklist

**Date:** January 1, 2026  
**Purpose:** Verify all role-based access control fixes are working correctly

---

## ✅ Fixes Implemented

### 1. **Database-Driven Roles** ✅
- Reads `user_profiles.role` from database
- Routes based on role, not hardcoded names
- Passes user profile data to components

### 2. **External Task Commitment Approval Queue** ✅
- New `CommitmentApprovalQueue` component
- Database methods for fetching/approving/denying commitments
- Parent screen shows both commitment and submission approvals

### 3. **Task Visibility Filtering** ✅
- Kids only see tasks from related issuers
- Queries `family_relationships` first
- Filters tasks by allowed issuer IDs

### 4. **External Task Detection** ✅
- Already handled by database trigger (fixed earlier)
- Trigger checks `family_relationships` for parent role
- Auto-sets `requires_parental_approval` for external tasks

---

## 🧪 Testing Protocol

### **Test 1: Kid View (Aveya or Onyx)**

#### Expected Behavior:
- [ ] Can browse marketplace
- [ ] Only sees tasks from related issuers (Lauren/Brett)
- [ ] Can commit to tasks
- [ ] Cannot see task creation/editing
- [ ] Cannot see approval queues
- [ ] Cannot see financial summary

#### Test Steps:
1. Launch app
2. Select Aveya or Onyx
3. Verify only kid features visible
4. Check marketplace shows filtered tasks
5. Try committing to a task
6. Verify no admin features accessible

---

### **Test 2: Parent View (Lauren or Brett)**

#### Expected Behavior:
- [ ] Can see approval queue tab
- [ ] Can see task management tab
- [ ] Can see financial summary tab
- [ ] Cannot see kid marketplace
- [ ] Cannot commit to tasks as a kid

#### Test Steps:
1. Launch app
2. Select Lauren or Brett
3. Verify parent dashboard appears
4. Check all three tabs load correctly
5. Verify no kid features visible

---

### **Test 3: External Task Approval Flow**

#### Prerequisites:
- Need to create a test external issuer (teacher/neighbor)
- Need to create relationship between kid and external issuer
- Need external issuer to create a task

#### Expected Behavior:
- [ ] Kid sees external issuer's task in marketplace
- [ ] Kid commits to external task
- [ ] Commitment appears in parent's approval queue (blue card)
- [ ] Parent can approve or deny
- [ ] If approved: commitment status → 'in_progress'
- [ ] If denied: commitment status → 'cancelled'
- [ ] Kid receives notification of parent's decision

#### Test Steps:
1. **Setup** (via database or admin panel):
   - Create external issuer user (role: 'parent', name: 'Ms. Johnson')
   - Create relationship: Aveya → Ms. Johnson (type: 'teacher')
   - Ms. Johnson creates task: "Complete homework"

2. **Kid commits to external task:**
   - Login as Aveya
   - Browse marketplace
   - Verify "Complete homework" task appears
   - Commit to task
   - Verify success message

3. **Parent approves:**
   - Switch to Lauren
   - Go to Approvals tab
   - Verify blue "External Task Commitment" card appears
   - Shows: Aveya wants to commit to "Complete homework" from Ms. Johnson
   - Click "Approve"
   - Verify card disappears

4. **Verify commitment status:**
   - Check database: commitment should have `parental_approval_status = 'approved'`
   - Check database: commitment should have `status = 'in_progress'`

---

### **Test 4: Task Visibility Filtering**

#### Expected Behavior:
- [ ] Kids only see tasks from issuers they have relationships with
- [ ] If no relationships exist, marketplace is empty
- [ ] Adding a relationship immediately shows that issuer's tasks

#### Test Steps:
1. Login as Aveya
2. Note which tasks appear in marketplace
3. Check database: `family_relationships` where `earner_id = Aveya's ID`
4. Verify marketplace only shows tasks from those `issuer_id`s
5. (Optional) Remove a relationship and verify those tasks disappear

---

### **Test 5: Role Routing**

#### Expected Behavior:
- [ ] User role determines which dashboard loads
- [ ] Changing role in database changes dashboard
- [ ] Unknown roles are rejected

#### Test Steps:
1. Login as Aveya (role: 'kid')
2. Verify kid marketplace loads
3. Switch user
4. Login as Lauren (role: 'parent')
5. Verify parent dashboard loads
6. (Optional) Change Aveya's role to 'parent' in database
7. Reload app, login as Aveya
8. Verify parent dashboard loads (role-based, not name-based)

---

### **Test 6: Work Submission Approval (Existing Feature)**

#### Expected Behavior:
- [ ] Kid submits work
- [ ] Submission appears in parent's approval queue (orange card)
- [ ] Parent can review and approve
- [ ] XP and credits awarded

#### Test Steps:
1. Login as Aveya
2. Go to "My Ments" tab
3. Select an in-progress commitment
4. Submit work with photo
5. Switch to Lauren
6. Go to Approvals tab
7. Verify orange "Work Submission" card appears
8. Review and approve
9. Verify XP and credits awarded to Aveya

---

## 🚨 Edge Cases to Test

### **Edge Case 1: No Relationships**
- **Scenario:** Kid has no relationships in `family_relationships`
- **Expected:** Marketplace shows empty state
- **Test:** Remove all relationships for Onyx, verify empty marketplace

### **Edge Case 2: Issuer Has No Tasks**
- **Scenario:** Kid has relationship with issuer who hasn't created tasks
- **Expected:** Marketplace shows empty or only shows other issuers' tasks
- **Test:** Create relationship with issuer who has 0 tasks

### **Edge Case 3: Multiple Pending Approvals**
- **Scenario:** Kid commits to 3 external tasks at once
- **Expected:** All 3 appear in parent's queue as separate cards
- **Test:** Commit to multiple external tasks, verify all appear

### **Edge Case 4: Deny Commitment**
- **Scenario:** Parent denies external task commitment
- **Expected:** Commitment status → 'cancelled', kid notified
- **Test:** Deny a commitment, verify status and notification

### **Edge Case 5: Internal Task (No Approval Needed)**
- **Scenario:** Kid commits to task from parent/guardian
- **Expected:** No approval needed, commitment immediately active
- **Test:** Commit to Lauren's task, verify no approval queue entry

---

## 📊 Success Criteria

### **All Tests Must Pass:**
- ✅ Kids see only kid features
- ✅ Parents see only parent features
- ✅ External task approvals work end-to-end
- ✅ Task visibility properly filtered
- ✅ Role routing works from database
- ✅ No cross-role access or leakage

### **Database Integrity:**
- ✅ `requires_parental_approval` set correctly
- ✅ `parental_approval_status` updates correctly
- ✅ Commitment status transitions correctly
- ✅ Notifications sent to correct users

### **User Experience:**
- ✅ No errors or crashes
- ✅ Clear visual distinction (blue vs orange cards)
- ✅ Appropriate empty states
- ✅ Smooth approval/denial flow

---

## 🐛 Known Issues / Limitations

### **Not Yet Implemented:**
1. **Issuer-specific view** - External issuers (teachers, neighbors) don't have their own dashboard yet
2. **Messaging system** - Parents can't message external issuers
3. **Issuer discovery** - No UI for kids to request connections with new issuers
4. **Relationship management UI** - Relationships must be created via database

### **Future Enhancements:**
- Issuer dashboard to manage their own tasks
- Parent-to-issuer messaging
- Relationship request/approval flow
- Issuer directory and discovery

---

## ✅ Sign-Off

**Tester:** _________________  
**Date:** _________________  

**All critical tests passed:** ☐ Yes ☐ No  
**Ready for gamification:** ☐ Yes ☐ No  

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
