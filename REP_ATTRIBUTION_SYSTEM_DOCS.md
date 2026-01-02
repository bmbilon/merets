# Rep Attribution System - Complete Documentation

## 🎯 Overview

The **Rep Attribution System** is an immutable, blockchain-inspired ledger that automatically tracks and attributes every action affecting a child's reputation score. It serves as the **source of truth** for accountability, creating an irrefutable record of commitment and performance.

### Core Principles

1. **IMMUTABLE**: Rep history cannot be deleted or modified, only appended
2. **AUTOMATIC**: Rep updates trigger on every relevant action without manual intervention
3. **DETERMINISTIC**: Same inputs always produce the same Rep score
4. **TRANSPARENT**: Full audit trail of all Rep changes with complete attribution
5. **TRUSTWORTHY**: Cryptographically linked entries prevent tampering

---

## 📊 Rep Scoring System

### Score Range
- **0-99**: Achievable Rep scores
- **100**: Intentionally unattainable to keep kids motivated

### Rep Tiers

| Range | Title | Abbrev | Description |
|-------|-------|--------|-------------|
| 0-9 | Unranked | — | New or unproven |
| 10-19 | Entry Earner | 1E-1E9 | Learning reliability |
| 20-29 | Active Earner | 2E-2E9 | Regularly completes tasks |
| 30-39 | Established Earner | 3E-3E9 | Dependable |
| 40-49 | Advanced Earner | 4E-4E9 | High reliability |
| 50-59 | Meritous Earner | 5M-5M9 | Reputation precedes them |
| 60-69 | Senior Meritous | 6M0-6M9 | Rare reliability |
| 70-79 | Elite Meritous | 7M0-7M9 | Exceptional consistency |
| 80-89 | Virtuous Earner | 8V-8V9 | Work accepted automatically |
| 90-99 | Exceptionally Meretous | 9X-999 | Word is gold |

---

## 🧮 Rep Calculation Formula

Rep score is calculated using a weighted formula with five factors:

### Factors & Weights

1. **Completion Rate** (40%)
   - Completed tasks ÷ Total tasks
   - Most important factor
   - Rewards consistent completion

2. **Quality Score** (30%)
   - Average of all quality ratings (1-5 stars)
   - Converted to 0-100% scale
   - Rewards high-quality work

3. **Consistency Bonus** (15%)
   - 50% from current streak (1 day = 2%, capped at 25 days)
   - 50% from recent activity (1 task in last 30 days = 2%, capped at 25 tasks)
   - Rewards regular engagement

4. **Volume Bonus** (10%)
   - Logarithmic scale based on total completed tasks
   - 5 tasks = 1 point, 50 tasks = 7 points, 200+ tasks = 10 points
   - Rewards experience

5. **Failure Penalty** (-5%)
   - Exponential penalty for recent failures (last 30 days)
   - 1 failure = -10%, 2 failures = -25%, 5+ failures = -100%
   - **Rep lost quickly** - harsh penalty for failures

### Formula
```
Rep Score = (Completion Rate × 0.40) + 
            (Quality Score × 0.30) + 
            (Consistency × 0.15) + 
            (Volume Bonus × 0.10) - 
            (Failure Penalty × 0.05)

Clamped to 0-99 range
```

---

## 🔗 Blockchain Architecture

### Immutable Ledger Structure

Each Rep change creates an entry in the `rep_history` table with:

- **Entry ID**: Unique identifier
- **User ID**: Owner of the Rep
- **Old Rep / New Rep**: Before and after scores
- **Change Amount**: Delta (+/-)
- **Action Type**: What triggered the change
- **Timestamp**: When it occurred
- **Attribution Data**: All factors at time of change
- **Blockchain Hash**: SHA256 hash linking to previous entry
- **Previous Entry ID**: Creates the chain

### Hash Generation

Each entry's hash is calculated from:
```
SHA256(
  user_id + 
  old_rep + 
  new_rep + 
  change_amount + 
  timestamp + 
  previous_hash
)
```

This creates a **blockchain-like chain** where:
- Each entry depends on the previous entry's hash
- Any tampering breaks the chain
- Verification can detect corruption

### Immutability Enforcement

Database rules prevent:
- **Deletion**: `ON DELETE DO NOTHING`
- **Updates**: `ON UPDATE DO NOTHING`

Once written, Rep history is **permanent**.

---

## ⚡ Automatic Attribution Triggers

Rep updates automatically on these events:

### 1. Task Completion
**Trigger**: `commitments.status` changes to `'completed'`
**Action**: 
- Increment `completed_commitments`
- Recalculate Rep score
- Record entry with `action_type = 'task_completed'`

### 2. Task Failure
**Trigger**: `commitments.status` changes to `'failed'`
**Action**:
- Increment `failed_commitments`
- Apply failure penalty
- Record entry with `action_type = 'task_failed'`

### 3. Task Cancellation
**Trigger**: `commitments.status` changes to `'cancelled'`
**Action**:
- Increment `failed_commitments`
- Apply failure penalty (less harsh than failure)
- Record entry with `action_type = 'task_cancelled'`

### 4. Quality Rating (Approval)
**Trigger**: `commitment_submissions.status` changes to `'approved'` with `quality_rating`
**Action**:
- Update `average_quality_rating`
- Recalculate Rep score
- Record entry with `action_type = 'quality_rating'`

### 5. Work Rejection
**Trigger**: `commitment_submissions.status` changes to `'rejected'`
**Action**:
- Apply rejection penalty
- Recalculate Rep score
- Record entry with `action_type = 'work_rejected'`

---

## 🎁 Rep-Based Privileges

### Pay Multipliers
- **50-59 Rep**: 1.05× (5% bonus)
- **60-69 Rep**: 1.10× (10% bonus)
- **70-79 Rep**: 1.15× (15% bonus)
- **80-89 Rep**: 1.20× (20% bonus)
- **90-99 Rep**: 1.25× (25% bonus)

### Auto-Approval
- **80+ Rep**: External tasks auto-approved without parent review
- Saves time for trusted kids
- Builds autonomy

### Instant Pay
- **90+ Rep**: Payment released immediately upon submission
- No waiting for approval
- Ultimate trust privilege

---

## 🛠️ Database Schema

### Enhanced `rep_history` Table

```sql
CREATE TABLE rep_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  old_rep INTEGER NOT NULL,
  new_rep INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  change_reason TEXT NOT NULL,
  action_type TEXT NOT NULL,
  related_commitment_id UUID,
  related_submission_id UUID,
  
  -- Attribution data (snapshot at time of change)
  completion_rate_at_time DECIMAL(5,2),
  quality_score_at_time DECIMAL(5,2),
  consistency_score_at_time DECIMAL(5,2),
  volume_bonus_at_time INTEGER,
  failure_penalty_at_time INTEGER,
  
  -- Blockchain fields
  blockchain_hash TEXT NOT NULL,
  previous_entry_id UUID,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Key Functions

1. **`calculate_rep_score_with_attribution(user_id)`**
   - Returns Rep score + all attribution factors
   - Deterministic calculation

2. **`update_user_rep_with_attribution()`**
   - Trigger function for automatic updates
   - Creates immutable ledger entry

3. **`generate_rep_blockchain_hash(...)`**
   - Generates SHA256 hash for blockchain linking
   - Ensures immutability

4. **`verify_rep_blockchain(user_id)`**
   - Verifies integrity of entire chain
   - Detects tampering

5. **`get_rep_audit_trail(user_id, limit)`**
   - Returns complete audit trail
   - Full transparency

---

## 📱 React Components

### 1. RepBadge
**Purpose**: Display Rep score and tier badge
**Variants**:
- `minimal`: Just tier abbreviation
- `compact`: Tier + score
- `full`: Complete with progress and privileges

**Usage**:
```tsx
<RepBadge repScore={75} variant="compact" />
```

### 2. RepProfile
**Purpose**: Full Rep profile with breakdown
**Features**:
- Current Rep score and tier
- Privileges display
- Factor breakdown with progress bars
- Tips to improve Rep

**Usage**:
```tsx
<RepProfile userId={userId} userName={userName} />
```

### 3. RepHistory
**Purpose**: Display Rep change history
**Features**:
- Chronological list of changes
- Change reasons and amounts
- Time-relative timestamps

**Usage**:
```tsx
<RepHistory userId={userId} limit={20} />
```

### 4. RepChangeToast
**Purpose**: Real-time notifications for Rep changes
**Features**:
- Auto-appears on significant changes (±3 or more)
- Animated slide-in
- Shows old → new Rep with change amount
- Auto-dismisses after 5 seconds

**Usage**:
```tsx
<RepChangeToast userId={userId} />
```

### 5. RepBlockchainVerifier
**Purpose**: Audit and verification tool
**Features**:
- Blockchain integrity verification
- Complete audit trail
- Attribution breakdown
- Hash display for transparency

**Usage**:
```tsx
<RepBlockchainVerifier userId={userId} userName={userName} />
```

---

## 🪝 React Hooks

### useRepAttribution
**Purpose**: Main hook for Rep data and real-time updates

**Returns**:
- `repData`: Current Rep with full attribution
- `auditTrail`: Recent Rep history
- `blockchainStatus`: Verification results
- `loading`: Loading state
- `error`: Error state
- `refresh()`: Manual refresh
- `verifyBlockchain()`: Run verification
- `fetchAuditTrail(limit)`: Load more history

**Usage**:
```tsx
const { repData, auditTrail, loading, refresh } = useRepAttribution(userId);
```

### useRepChangeNotifications
**Purpose**: Listen for real-time Rep changes

**Usage**:
```tsx
useRepChangeNotifications(userId, (change) => {
  console.log('Rep changed:', change);
});
```

### useRepPrivileges
**Purpose**: Get Rep-based privileges for a score

**Returns**:
- `canAutoApprove`: Boolean
- `canInstantPay`: Boolean
- `payMultiplier`: Number
- `requiresManualApproval`: Boolean

**Usage**:
```tsx
const privileges = useRepPrivileges(repScore);
```

---

## 🚀 Installation Instructions

### Step 1: Apply CREATE_REP_SYSTEM.sql
This creates the base Rep system tables and functions.

```sql
-- Run in Supabase SQL Editor
-- File: /supabase/CREATE_REP_SYSTEM.sql
```

### Step 2: Apply REP_ATTRIBUTION_SYSTEM.sql
This adds the blockchain attribution layer.

```sql
-- Run in Supabase SQL Editor
-- File: /supabase/REP_ATTRIBUTION_SYSTEM.sql
```

### Step 3: Verify Installation

```sql
-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%rep%';

-- Verify triggers
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%rep%';
```

### Step 4: Test with Sample Data

```sql
-- Get a user's Rep data
SELECT * FROM calculate_rep_score_with_attribution('user-id-here');

-- Verify blockchain
SELECT * FROM verify_rep_blockchain('user-id-here');

-- View audit trail
SELECT * FROM get_rep_audit_trail('user-id-here', 10);
```

---

## 🧪 Testing Scenarios

### Scenario 1: Complete a Task
1. Kid commits to a task
2. Kid submits work
3. Parent approves with 5-star rating
4. **Expected**: Rep increases, entry added to ledger

### Scenario 2: Fail a Task
1. Kid commits to a task
2. Task deadline passes without submission
3. Status changes to `'failed'`
4. **Expected**: Rep decreases significantly, failure penalty applied

### Scenario 3: Cancel a Task
1. Kid commits to a task
2. Kid cancels before completion
3. **Expected**: Rep decreases (less than failure), entry recorded

### Scenario 4: Reject Submission
1. Kid submits work
2. Parent rejects with feedback
3. **Expected**: Rep decreases, rejection recorded

### Scenario 5: Build Consistency
1. Kid completes tasks daily for 10 days
2. **Expected**: Consistency bonus increases, Rep climbs

### Scenario 6: Blockchain Verification
1. Run `verify_rep_blockchain(user_id)`
2. **Expected**: `is_valid = true`, all entries verified

---

## 🔍 Monitoring & Debugging

### Check Rep Calculation
```sql
SELECT * FROM calculate_rep_score_with_attribution('user-id');
```

### View Recent Changes
```sql
SELECT * FROM rep_history 
WHERE user_id = 'user-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Verify Blockchain Integrity
```sql
SELECT * FROM verify_rep_blockchain('user-id');
```

### Check Trigger Status
```sql
SELECT * FROM pg_trigger 
WHERE tgname LIKE '%rep%';
```

### Debug Rep Not Updating
1. Check if triggers are enabled
2. Verify commitment status changes
3. Check for errors in logs
4. Ensure user_id is correct

---

## 📈 Rep Growth Strategies (For Kids)

### Fast Growth
1. ✅ Complete tasks consistently (builds completion rate)
2. ⭐ Deliver high-quality work (5-star ratings)
3. 🔥 Maintain daily streak (consistency bonus)
4. 📚 Take on more tasks (volume bonus)

### Avoid Rep Loss
1. ❌ Never cancel tasks unnecessarily
2. ⏰ Meet deadlines to avoid failures
3. 🎯 Focus on quality over speed
4. 💬 Communicate if you need help

### Unlock Privileges
- **50 Rep**: Start earning pay bonuses
- **80 Rep**: Unlock auto-approval
- **90 Rep**: Achieve instant pay

---

## 🎓 Educational Value

The Rep Attribution System teaches kids:

1. **Accountability**: Every action has consequences
2. **Consistency**: Regular effort builds reputation
3. **Quality**: Excellence is rewarded
4. **Trust**: High Rep unlocks privileges
5. **Transparency**: Full visibility into their record
6. **Immutability**: Past actions can't be erased
7. **Recovery**: Rep can be rebuilt after mistakes

---

## 🔐 Security & Privacy

### Data Protection
- Rep data is user-specific
- Only accessible to user and parents
- Blockchain prevents tampering

### Immutability Benefits
- Creates trust between parents and kids
- Prevents disputes about past performance
- Provides objective evidence for privileges

### Verification
- Anyone can verify blockchain integrity
- Cryptographic hashing ensures authenticity
- Transparent audit trail

---

## 🚦 Next Steps

### Phase 1: Database Setup ✅
- [x] Create Rep tables
- [x] Build calculation functions
- [x] Set up triggers
- [x] Add blockchain hashing

### Phase 2: UI Integration ✅
- [x] RepBadge component
- [x] RepProfile component
- [x] RepHistory component
- [x] RepChangeToast notifications
- [x] RepBlockchainVerifier

### Phase 3: Testing (Next)
- [ ] Apply SQL to Supabase
- [ ] Test automatic Rep updates
- [ ] Verify blockchain integrity
- [ ] Test all UI components
- [ ] End-to-end workflow testing

### Phase 4: Deployment
- [ ] Push to GitHub
- [ ] Update production database
- [ ] Monitor initial usage
- [ ] Gather feedback

---

## 📞 Support

For issues or questions about the Rep Attribution System:
1. Check this documentation
2. Review SQL functions in Supabase
3. Inspect rep_history table for audit trail
4. Run blockchain verification
5. Check trigger logs

---

## 🎉 Summary

The Rep Attribution System is the **heart of Merets** - an immutable, blockchain-inspired ledger that automatically tracks every action affecting a child's reputation. It creates a trustworthy source of truth for accountability, teaching kids the value of consistency, quality, and commitment while providing parents with complete transparency and objective evidence for privileges.

**Rep earned slowly, lost quickly** - just like real-world reputation.
