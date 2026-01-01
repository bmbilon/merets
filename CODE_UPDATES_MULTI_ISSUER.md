# Code Updates for Multi-Issuer Marketplace

**Date:** January 1, 2026  
**Purpose:** Specific code changes to implement multi-issuer marketplace with parental approval

---

## File 1: `/home/ubuntu/merets/app/(tabs)/index.tsx`

### Change 1: Update Task Fetching with Relationship Filtering

**Location:** Lines 85-100 (fetchMents function)

**Current Code:**
```typescript
const fetchMents = async () => {
  try {
    console.log('[FETCH] Starting to fetch ments from Supabase...');
    setLoading(true);
    
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .order('skill_category', { ascending: true });

    console.log('[FETCH] Supabase response:', { 
      dataCount: data?.length, 
      hasError: !!error,
      errorDetails: error 
    });
    // ... rest of function
  }
};
```

**Updated Code:**
```typescript
const fetchMents = async () => {
  try {
    console.log('[FETCH] Starting to fetch ments from Supabase...');
    setLoading(true);
    
    // Get user profile to get user ID
    const userProfile = await SupabaseService.getUserByName(userName);
    if (!userProfile) {
      console.error('[FETCH] User profile not found');
      setLoading(false);
      return;
    }

    // Step 1: Get all issuer IDs this kid has relationships with
    const { data: relationships, error: relError } = await supabase
      .from('family_relationships')
      .select('issuer_id, relationship_type')
      .eq('earner_id', userProfile.id);

    if (relError) {
      console.error('[FETCH] Error fetching relationships:', relError);
      setLoading(false);
      return;
    }

    if (!relationships || relationships.length === 0) {
      console.log('[FETCH] No relationships found for user');
      setMents([]);
      setLoading(false);
      return;
    }

    const issuerIds = relationships.map(r => r.issuer_id);
    console.log('[FETCH] Found relationships with issuers:', issuerIds);

    // Step 2: Fetch tasks from those issuers
    const { data, error } = await supabase
      .from('task_templates')
      .select(`
        *,
        issuer:user_profiles!task_templates_issuer_id_fkey(
          id,
          name,
          role
        )
      `)
      .in('issuer_id', issuerIds)
      .eq('is_available_for_kids', true)
      .order('skill_category', { ascending: true });

    console.log('[FETCH] Supabase response:', { 
      dataCount: data?.length, 
      hasError: !!error,
      errorDetails: error,
      issuerCount: issuerIds.length
    });
    // ... rest of function (keep existing mapping logic)
  }
};
```

---

### Change 2: Update Commitment Creation with External Task Detection

**Location:** Lines 149-180 (handleCommit function)

**Current Code:**
```typescript
const handleCommit = async (mentId: string) => {
  try {
    // Get user profile to get user ID
    const userProfile = await SupabaseService.getUserByName(userName);
    if (!userProfile) {
      console.error('User profile not found');
      return;
    }

    // Find the selected task
    const selectedTask = ments.find(m => m.id === mentId);
    if (!selectedTask) {
      console.error('Task not found');
      return;
    }

    // Create commitment in database
    const commitment = await SupabaseService.createCommitment({
      user_id: userProfile.id,
      task_template_id: mentId,
      skill_category: selectedTask.category,
      effort_minutes: parseInt(selectedTask.timeEstimate) || 30,
      pay_cents: Math.round(selectedTask.credits * 100),
      status: 'in_progress'
    });

    console.log('Commitment created:', commitment.id);
    setShowDetail(false);
    
    // Refresh the ments list
    await fetchMents();
  } catch (error) {
    console.error('Error creating commitment:', error);
  }
};
```

**Updated Code:**
```typescript
const handleCommit = async (mentId: string) => {
  try {
    // Get user profile to get user ID
    const userProfile = await SupabaseService.getUserByName(userName);
    if (!userProfile) {
      console.error('User profile not found');
      Alert.alert('Error', 'User profile not found');
      return;
    }

    // Find the selected task
    const selectedTask = ments.find(m => m.id === mentId);
    if (!selectedTask) {
      console.error('Task not found');
      Alert.alert('Error', 'Task not found');
      return;
    }

    // Get the full task template to get issuer_id
    const { data: taskTemplate, error: taskError } = await supabase
      .from('task_templates')
      .select('*, issuer:user_profiles!task_templates_issuer_id_fkey(id, name)')
      .eq('id', mentId)
      .single();

    if (taskError || !taskTemplate) {
      console.error('Error fetching task template:', taskError);
      Alert.alert('Error', 'Could not load task details');
      return;
    }

    // Check if issuer is the kid's parent/guardian
    const { data: parentRelationship } = await supabase
      .from('family_relationships')
      .select('id, relationship_type')
      .eq('issuer_id', taskTemplate.issuer_id)
      .eq('earner_id', userProfile.id)
      .in('relationship_type', ['parent', 'guardian'])
      .maybeSingle();

    const isParentTask = !!parentRelationship;
    const requiresApproval = !isParentTask;

    console.log('[COMMIT] Task details:', {
      taskId: mentId,
      issuerId: taskTemplate.issuer_id,
      issuerName: taskTemplate.issuer?.name,
      isParentTask,
      requiresApproval
    });

    // Create commitment with appropriate approval flags
    const commitment = await SupabaseService.createCommitment({
      user_id: userProfile.id,
      task_template_id: mentId,
      issuer_id: taskTemplate.issuer_id,
      skill_category: selectedTask.category,
      effort_minutes: parseInt(selectedTask.timeEstimate) || 30,
      pay_cents: Math.round(selectedTask.credits * 100),
      status: requiresApproval ? 'pending_approval' : 'accepted',
      requires_parental_approval: requiresApproval,
      parental_approval_status: requiresApproval ? 'pending' : 'not_required',
    });

    console.log('Commitment created:', commitment.id);
    setShowDetail(false);

    // Show appropriate feedback
    if (requiresApproval) {
      Alert.alert(
        '⏳ Approval Required',
        `This task is from ${taskTemplate.issuer?.name}. Your parent/guardian will be notified to approve your commitment.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        '✅ Success!',
        'You've committed to this task. Time to get started!',
        [{ text: 'Let\'s Go!' }]
      );
    }
    
    // Refresh the ments list
    await fetchMents();
  } catch (error) {
    console.error('Error creating commitment:', error);
    Alert.alert('Error', 'Failed to commit to task. Please try again.');
  }
};
```

---

### Change 3: Add Issuer Badge to Task Cards

**Location:** In the MentsMarketplace component (or wherever task cards are rendered)

**Add to task card UI:**
```typescript
// Add this to the task card rendering
{task.issuer && (
  <View style={styles.issuerBadge}>
    <Text style={styles.issuerName}>
      {task.issuer.name}
    </Text>
    {task.requiresApproval && (
      <Text style={styles.approvalBadge}>
        🔒 Requires Parent Approval
      </Text>
    )}
  </View>
)}
```

**Add styles:**
```typescript
const styles = StyleSheet.create({
  // ... existing styles
  issuerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  issuerName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  approvalBadge: {
    fontSize: 10,
    color: '#ff9800',
    fontWeight: '600',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
```

---

## File 2: `/home/ubuntu/merets/lib/supabase-service.ts`

### Change: Update createCommitment to accept new fields

**Location:** Lines 143-150

**Current Code:**
```typescript
static async createCommitment(commitment: Omit<Commitment, 'id' | 'created_at'>): Promise<Commitment> {
  const { data, error } = await supabase
    .from('commitments')
    .insert(commitment)
    .select('*')
    .single()
  
  if (error) throw error
  return data
}
```

**Updated Code:**
```typescript
static async createCommitment(commitment: Omit<Commitment, 'id' | 'created_at'>): Promise<Commitment> {
  console.log('[SupabaseService] Creating commitment:', commitment);
  
  const { data, error } = await supabase
    .from('commitments')
    .insert(commitment)
    .select('*')
    .single()
  
  if (error) {
    console.error('[SupabaseService] Error creating commitment:', error);
    throw error;
  }
  
  console.log('[SupabaseService] Commitment created successfully:', data.id);
  return data;
}
```

---

## File 3: `/home/ubuntu/merets/lib/types.ts`

### Change: Update Commitment type to include new fields

**Location:** Commitment interface

**Add these fields to the Commitment interface:**
```typescript
export interface Commitment {
  id: string
  user_id: string
  task_template_id: string | null
  custom_title: string | null
  custom_description: string | null
  skill_category: string
  effort_minutes: number
  pay_cents: number
  status: string
  quality_rating: string | null
  completed_at: string | null
  created_at: string
  due_date: string | null
  actual_pay_cents: number | null
  time_started: string | null
  time_completed: string | null
  parent_feedback: string | null
  kid_notes: string | null
  
  // NEW FIELDS for multi-issuer support
  issuer_id: string | null
  requires_parental_approval: boolean
  parental_approval_status: 'not_required' | 'pending' | 'approved' | 'denied'
  parent_approver_id: string | null
  parent_approval_notes: string | null
  
  // Existing fields
  evidence_photo_url: string | null
  evidence_uploaded_at: string | null
  evidence_notes: string | null
}
```

---

## File 4: `/home/ubuntu/merets/components/ParentApprovalQueue.tsx`

### Change: Add External Task Approval Section

**Add new state and query:**
```typescript
const [externalTaskApprovals, setExternalTaskApprovals] = useState<any[]>([]);

// Add to existing useEffect or create new one
useEffect(() => {
  fetchExternalTaskApprovals();
}, []);

const fetchExternalTaskApprovals = async () => {
  try {
    // Get current parent user
    const parentProfile = await SupabaseService.getUserByName(parentName);
    if (!parentProfile) return;

    // Get all kids this parent has relationships with
    const { data: relationships } = await supabase
      .from('family_relationships')
      .select('earner_id')
      .eq('issuer_id', parentProfile.id)
      .in('relationship_type', ['parent', 'guardian']);

    if (!relationships || relationships.length === 0) return;

    const kidIds = relationships.map(r => r.earner_id);

    // Get pending external task approvals for those kids
    const { data, error } = await supabase
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
      .in('user_id', kidIds)
      .eq('requires_parental_approval', true)
      .eq('parental_approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching external task approvals:', error);
      return;
    }

    setExternalTaskApprovals(data || []);
  } catch (error) {
    console.error('Error in fetchExternalTaskApprovals:', error);
  }
};
```

**Add approval/denial handlers:**
```typescript
const handleApproveExternalTask = async (commitmentId: string) => {
  try {
    const parentProfile = await SupabaseService.getUserByName(parentName);
    if (!parentProfile) return;

    const { error } = await supabase
      .from('commitments')
      .update({
        parental_approval_status: 'approved',
        parent_approver_id: parentProfile.id,
        status: 'accepted',
      })
      .eq('id', commitmentId);

    if (error) throw error;

    Alert.alert('✅ Approved', 'The commitment has been approved. Your child can now proceed.');
    fetchExternalTaskApprovals();
  } catch (error) {
    console.error('Error approving external task:', error);
    Alert.alert('Error', 'Failed to approve commitment');
  }
};

const handleDenyExternalTask = async (commitmentId: string) => {
  try {
    const parentProfile = await SupabaseService.getUserByName(parentName);
    if (!parentProfile) return;

    const { error } = await supabase
      .from('commitments')
      .update({
        parental_approval_status: 'denied',
        parent_approver_id: parentProfile.id,
        status: 'rejected',
      })
      .eq('id', commitmentId);

    if (error) throw error;

    Alert.alert('❌ Denied', 'The commitment has been denied.');
    fetchExternalTaskApprovals();
  } catch (error) {
    console.error('Error denying external task:', error);
    Alert.alert('Error', 'Failed to deny commitment');
  }
};
```

**Add UI section:**
```typescript
{/* External Task Approvals Section */}
{externalTaskApprovals.length > 0 && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>
      🔒 External Task Approvals ({externalTaskApprovals.length})
    </Text>
    <Text style={styles.sectionSubtitle}>
      Your child wants to commit to tasks from external issuers
    </Text>
    
    {externalTaskApprovals.map((commitment) => (
      <Card key={commitment.id} style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={styles.taskTitle}>{commitment.task.title}</Text>
            <Text style={styles.issuerBadge}>
              From: {commitment.issuer.name}
            </Text>
          </View>
          
          <Text style={styles.earnerName}>
            Requested by: {commitment.earner.name}
          </Text>
          
          <View style={styles.taskDetails}>
            <Text style={styles.detailText}>
              💰 ${(commitment.pay_cents / 100).toFixed(2)}
            </Text>
            <Text style={styles.detailText}>
              ⏱️ {commitment.effort_minutes} min
            </Text>
            <Text style={styles.detailText}>
              📂 {commitment.skill_category}
            </Text>
          </View>
          
          {commitment.task.description && (
            <Text style={styles.description}>
              {commitment.task.description}
            </Text>
          )}
        </Card.Content>
        
        <Card.Actions>
          <Button 
            mode="outlined" 
            onPress={() => handleDenyExternalTask(commitment.id)}
            textColor="#f44336"
          >
            Deny
          </Button>
          <Button 
            mode="contained" 
            onPress={() => handleApproveExternalTask(commitment.id)}
          >
            Approve
          </Button>
        </Card.Actions>
      </Card>
    ))}
  </View>
)}
```

---

## Summary of Changes

### Files Modified:
1. ✅ `/home/ubuntu/merets/app/(tabs)/index.tsx` - Marketplace query + commitment creation
2. ✅ `/home/ubuntu/merets/lib/supabase-service.ts` - Add logging to createCommitment
3. ✅ `/home/ubuntu/merets/lib/types.ts` - Update Commitment interface
4. ✅ `/home/ubuntu/merets/components/ParentApprovalQueue.tsx` - Add external task approval section

### Key Features Implemented:
- ✅ Task visibility filtered by family_relationships
- ✅ External task detection (requires approval if issuer is not parent)
- ✅ Issuer name displayed on task cards
- ✅ "Requires Approval" badge for external tasks
- ✅ Parent approval queue for external task commitments
- ✅ Approve/Deny functionality for parents
- ✅ Appropriate user feedback (alerts)

### Testing Checklist:
- [ ] Run UPDATE_NOTIFICATION_TRIGGERS_V2.sql first
- [ ] Run TEST_DATA_MULTI_ISSUER.sql to create test scenarios
- [ ] Login as kid → should see tasks from all related issuers
- [ ] Commit to parent task → should accept immediately
- [ ] Commit to external task → should require approval
- [ ] Login as parent → should see external task approval requests
- [ ] Approve external task → kid's commitment should become "accepted"
- [ ] Deny external task → kid's commitment should become "rejected"

---

## Next Steps After Implementation:

1. ✅ Test parent-only issuer flow (current demo)
2. ✅ Test multi-issuer flow with test data
3. ✅ Add notification handling for approvals/denials
4. ✅ Polish UI with better badges and indicators
5. ✅ Add issuer profile pages
6. ✅ Implement issuer connection requests (future)
7. ✅ Add task visibility controls (future)
