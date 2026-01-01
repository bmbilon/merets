# Merets UX Overhaul v1.5.02

## Overview

This document describes the comprehensive UX redesign implemented in v1.5.02, following the principles outlined in the Merets Manifesto and UX Map.

## Design Principles

### 1. Queue Pattern (No Scrolling Hell)
- Each role sees max 2-4 sections
- Each item has a single clear next action
- No endless scrolling through lists

### 2. Receipt Cards (Action Feedback)
- Every major action shows a receipt
- Displays what changed (credits, merets, rep)
- Shows what's next
- Indicates who was notified

### 3. Attention-Span Friendly
- Inspired by Greenlight and Joon
- Quick actions, minimal steps
- Visual hierarchy and clear CTAs
- Collapsible details

### 4. Role-Specific Navigation
- Dynamic tabs based on user role
- Earner, Parent, and Issuer see different interfaces
- Context-appropriate icons and labels

## Components Built

### Core Components

#### 1. ReceiptCard.tsx
**Purpose:** Universal feedback component for all actions

**Features:**
- Icon with color coding
- Title and subtitle
- Itemized changes (credits, rep, etc.)
- "What's Next" section
- Primary and secondary actions

**Usage:**
```typescript
<ReceiptCard
  visible={showReceipt}
  onDismiss={() => setShowReceipt(false)}
  title="Ment Committed!"
  subtitle={mentTitle}
  icon="checkmark.circle.fill"
  iconColor="#4CAF50"
  items={[
    { label: 'Payment', value: '$15', highlight: true },
    { label: 'Due', value: 'Tomorrow' }
  ]}
  nextSteps={[
    'Start working on this ment',
    'Submit when complete'
  ]}
/>
```

#### 2. MentDetailModal.tsx
**Purpose:** Full ment details with contract acceptance

**Features:**
- Comprehensive ment information
- Issuer trust indicators
- Contract terms display
- Two-step commitment (view → confirm)
- Receipt on commit

**Flow:**
1. User taps ment card
2. Modal shows full details
3. "Commit" button shows contract confirmation
4. "Yes, I Commit" triggers receipt
5. Receipt shows next steps

#### 3. MentsMarketplace.tsx
**Purpose:** Browse and discover available ments

**Features:**
- Section tabs (Recommended, Quick, Available, Active)
- Compact ment cards
- Quick info chips (time, due date, approval)
- Pull to refresh
- Empty states

**Sections:**
- **Recommended:** Rank-eligible, high-fit ments
- **Quick:** Micro tasks (< 30 min)
- **Available:** All marketplace ments
- **Active:** User's in-progress ments

### Earner Components

#### 4. EarnerDashboard.tsx
**Purpose:** Main dashboard for earners

**Features:**
- Rep badge with progress bar
- Tab navigation (Overview, Active, History)
- Stats grid (earnings, completed)
- Active ments section
- Recent activity timeline

**Tabs:**
- **Overview:** Stats, active ments, recent activity
- **Active:** All in-progress ments with actions
- **History:** Completed ments with ratings

### Parent Components

#### 5. ParentApprovalQueue.tsx
**Purpose:** Review and approve ment commitments

**Features:**
- Pending approvals list
- Expandable cards with full details
- Issuer trust indicators
- Safety notes highlighting
- Approve/Reject with receipts

**Flow:**
1. Pending approval appears
2. Parent taps to expand
3. Reviews details, issuer, safety
4. Approves or rejects
5. Receipt confirms action
6. Earner is notified

### Issuer Components

#### 6. IssuerReviewQueue.tsx
**Purpose:** Review submitted work and rate earners

**Features:**
- Submitted ments queue
- Expandable cards with submission details
- Proof of completion photos
- 5-star rating system
- Comment field (required if ≤2★)
- Optional tip
- Add to favorites
- Request redo option
- Receipt on review

**Flow:**
1. Earner submits work
2. Appears in review queue
3. Issuer expands to see details
4. Taps "Review This Ment"
5. Rates, comments, optionally tips
6. Submits review
7. Receipt shows what happened
8. Earner receives notification

#### 7. CreateMentModal.tsx
**Purpose:** Stepped wizard for creating ments

**Features:**
- 4-step wizard with progress bar
- Step 1: Title, description, category
- Step 2: Credits, difficulty
- Step 3: Time estimate, due date
- Step 4: Approval/repeatability settings
- Summary before publish
- Receipt on publish

**Steps:**
1. **What:** Title, description, category
2. **Pay:** Credits, difficulty level
3. **When:** Time estimate, due date
4. **Settings:** Approval required, repeatable

### Shared Components

#### 8. NotificationInbox.tsx
**Purpose:** Universal inbox for all notifications

**Features:**
- Filter tabs (All, Unread, Actionable)
- Notification cards with icons
- Unread indicator
- Action buttons for actionable items
- Mark all as read
- Pull to refresh
- Empty states

**Notification Types:**
- Ment committed
- Approval requested
- Approved/Rejected
- Work submitted
- Review completed
- Redo requested
- Tip received
- Redemption requested

## Navigation Structure

### Earner Tabs
1. **Ments** - Marketplace (index screen)
2. **Progress** - Dashboard with stats/rep
3. **Credits** - Earnings and redemption
4. **Inbox** - Notifications

### Parent Tabs
1. **Approvals** - Pending approval queue
2. **Kids** - Oversight dashboard
3. **Credits** - Redemption controls
4. **Inbox** - Notifications

### Issuer Tabs
1. **Issue** - Create ment button
2. **Review** - Submitted work queue
3. **Favorites** - Saved earners (CRM)
4. **Inbox** - Notifications

## Integration Guide

### Replacing Old Screens

#### Index Screen (Ments Marketplace)
```typescript
// Old: app/(tabs)/index.tsx
// Replace with MentsMarketplace component

import MentsMarketplace from '@/components/MentsMarketplace';
import MentDetailModal from '@/components/MentDetailModal';

export default function IndexScreen() {
  const [selectedMent, setSelectedMent] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <MentsMarketplace 
        onMentPress={(ment) => {
          setSelectedMent(ment);
          setShowDetail(true);
        }}
      />
      <MentDetailModal
        visible={showDetail}
        onDismiss={() => setShowDetail(false)}
        ment={selectedMent}
        onCommit={(mentId) => {
          // Handle commit logic
        }}
      />
    </>
  );
}
```

#### Earner Dashboard
```typescript
// Replace aveya-dashboard.tsx and onyx-dashboard.tsx
// With single reusable EarnerDashboard component

import EarnerDashboard from '@/components/EarnerDashboard';

export default function AveyaDashboard() {
  return (
    <EarnerDashboard
      userName="Aveya"
      userColor="#E91E63"
      rep={75}
      totalMerets={150}
      totalCredits={245}
      activeMents={3}
      completedMents={12}
    />
  );
}
```

#### Parent Screen
```typescript
// Replace app/(tabs)/parent.tsx
import ParentApprovalQueue from '@/components/ParentApprovalQueue';

export default function ParentScreen() {
  const [pendingApprovals, setPendingApprovals] = useState([]);

  return (
    <ParentApprovalQueue
      pendingApprovals={pendingApprovals}
      onApprove={(id) => {
        // Handle approval
      }}
      onReject={(id, reason) => {
        // Handle rejection
      }}
    />
  );
}
```

#### Issuer Dashboard
```typescript
// Replace app/(tabs)/issuer-dashboard.tsx
import IssuerReviewQueue from '@/components/IssuerReviewQueue';
import CreateMentModal from '@/components/CreateMentModal';

export default function IssuerDashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const [submittedMents, setSubmittedMents] = useState([]);

  return (
    <>
      <View>
        <Button onPress={() => setShowCreate(true)}>
          Create New Ment
        </Button>
        <IssuerReviewQueue
          submittedMents={submittedMents}
          onReview={(mentId, rating, comment, tip) => {
            // Handle review
          }}
          onRequestRedo={(mentId, comment) => {
            // Handle redo request
          }}
        />
      </View>
      <CreateMentModal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        onPublish={(mentData) => {
          // Handle publish
        }}
      />
    </>
  );
}
```

#### Inbox Screen
```typescript
// Replace app/(tabs)/inbox.tsx
import NotificationInbox from '@/components/NotificationInbox';

export default function InboxScreen() {
  const [notifications, setNotifications] = useState([]);

  return (
    <NotificationInbox
      notifications={notifications}
      onMarkAsRead={(id) => {
        // Mark notification as read
      }}
      onMarkAllAsRead={() => {
        // Mark all as read
      }}
      onRefresh={() => {
        // Fetch new notifications
      }}
    />
  );
}
```

## Data Integration

### Supabase Queries Needed

#### Fetch Ments for Marketplace
```typescript
const { data: ments } = await supabase
  .from('ments')
  .select('*')
  .eq('status', 'available')
  .order('created_at', { ascending: false });
```

#### Fetch Pending Approvals
```typescript
const { data: approvals } = await supabase
  .from('ments')
  .select('*, earner:profiles(*), issuer:profiles(*)')
  .eq('status', 'pending_approval')
  .eq('guardian_id', parentId);
```

#### Fetch Submitted Ments for Review
```typescript
const { data: submitted } = await supabase
  .from('ments')
  .select('*, earner:profiles(*)')
  .eq('issuer_id', issuerId)
  .eq('status', 'submitted')
  .order('submitted_at', { ascending: true });
```

#### Fetch Notifications
```typescript
const { data: notifications } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);
```

## Testing Checklist

### Earner Flow
- [ ] Browse ments marketplace
- [ ] View ment details
- [ ] Commit to ment
- [ ] See receipt after commit
- [ ] View active ments in dashboard
- [ ] Submit work with proof
- [ ] Receive review notification
- [ ] View rating and credits earned

### Parent Flow
- [ ] See pending approval notification
- [ ] Review approval request details
- [ ] Approve ment
- [ ] See receipt after approval
- [ ] Reject ment with reason
- [ ] View kid's progress dashboard
- [ ] Receive submission notifications

### Issuer Flow
- [ ] Create new ment (4-step wizard)
- [ ] See receipt after publishing
- [ ] Receive submission notification
- [ ] Review submitted work
- [ ] Rate with stars and comment
- [ ] Add tip (optional)
- [ ] Add to favorites
- [ ] Request redo if needed
- [ ] See receipt after review

## Next Steps

### Phase 6: Integration & Testing
1. Replace old screens with new components
2. Connect to Supabase
3. Test all flows end-to-end
4. Fix any bugs or edge cases

### Future Enhancements (v1.5.03+)
- Credits/redemption screen
- Favorites/CRM full implementation
- Savings goals
- Achievement badges
- Team tasks
- Leaderboards
- Data visualizations with charts
- Advanced filtering and search

## Design Assets

### Color Palette
- Primary: `#6200ee` (Purple)
- Success: `#4CAF50` (Green)
- Warning: `#FF9800` (Orange)
- Error: `#F44336` (Red)
- Info: `#2196F3` (Blue)
- Gold: `#FFD700` (Rep/Stars)

### Icon Usage
- Ments: `list.bullet.rectangle`
- Progress: `chart.line.uptrend.xyaxis`
- Credits: `dollarsign.circle.fill`
- Inbox: `bell.fill`
- Approvals: `checkmark.circle.fill`
- Review: `star.fill`
- Favorites: `heart.fill`
- Issue: `plus.circle.fill`

### Typography
- Headline: Bold, 28-32px
- Title: Bold, 18-22px
- Body: Regular, 14-16px
- Caption: Regular, 12px

## Conclusion

This UX overhaul transforms Merets from a functional app into a polished, attention-span-friendly platform that follows best practices from Greenlight, Joon, and modern marketplace apps. The queue pattern, receipt cards, and role-specific navigation create a seamless experience for all users while maintaining the core philosophy of the Merets Manifesto.
