# Parent Approval Flow - UI/UX Design

## Overview
Parents need a simple, efficient way to review submitted work, view photos, rate quality, and approve/reject submissions.

## User Flow

### 1. Parent Dashboard - Pending Submissions Tab
**Location:** New tab in parent view (alongside Marketplace, Stats, etc.)

**Display:**
- List of pending submissions (oldest first)
- Each card shows:
  - Kid's name + avatar
  - Task title
  - Pay amount
  - Thumbnail of first photo
  - "Time waiting" indicator (e.g., "2 hours ago")
  - "Review" button

**Empty State:**
- "No pending submissions"
- "Your kids haven't submitted any work yet"

---

### 2. Review Submission Modal
**Triggered by:** Clicking "Review" button on a submission card

**Modal Layout:**

#### Header
- Kid's name + Rep badge
- Task title
- Pay amount (prominent)

#### Photo Gallery
- Full-size photo viewer
- Swipe between multiple photos
- Zoom capability
- Photo counter (e.g., "1 of 3")

#### Submission Details
- Kid's notes (if provided)
- Time submitted
- Task requirements/description

#### Quality Rating
- 5-star rating system
- Stars are large, tappable
- Labels: "Poor" (1★) to "Excellent" (5★)

#### Bonus Tip (Optional)
- Text input for dollar amount
- Quick buttons: +$1, +$2, +$5
- Shows total payout: "Base: $5.00 + Tip: $2.00 = $7.00"

#### Review Notes (Optional)
- Text area for feedback
- Placeholder: "Great job! Next time try..."

#### Action Buttons
- **Approve** (green, prominent)
  - Shows final payout amount
  - Confirms: "Approve & Pay $7.00?"
  
- **Reject** (red, secondary)
  - Requires rejection reason
  - Confirms: "This will return the task to the marketplace"

---

### 3. Approval Confirmation
**After clicking Approve:**
- Brief success animation
- Toast: "✅ Approved! Aveya earned $7.00 and +15 Rep"
- Modal closes
- Submission removed from pending list
- (Optional) Confetti animation

---

### 4. Rejection Flow
**After clicking Reject:**
- Show rejection reason input
- Placeholder: "Why are you rejecting this? (Kid will see this)"
- Confirm button: "Reject & Return to Marketplace"
- Toast: "❌ Rejected. Task returned to marketplace."
- Modal closes

---

## Component Structure

```
ParentDashboard.tsx
├── PendingSubmissionsList
│   └── SubmissionCard (repeating)
│       ├── KidAvatar
│       ├── TaskInfo
│       ├── PhotoThumbnail
│       └── ReviewButton
│
└── ReviewSubmissionModal
    ├── ModalHeader
    ├── PhotoGallery
    ├── SubmissionDetails
    ├── QualityRating (StarRating component)
    ├── BonusTipInput
    ├── ReviewNotesInput
    └── ActionButtons
        ├── ApproveButton
        └── RejectButton
```

---

## Key Features

### Smart Defaults
- Default rating: 4 stars (encourage positive reinforcement)
- Bonus tip: $0 (optional)
- Review notes: Optional

### Validation
- Must select rating before approving
- Must provide reason before rejecting
- Bonus tip must be valid number

### Feedback
- Clear success/error messages
- Visual confirmation of actions
- Rep change preview before approval

### Performance
- Photos load progressively
- Optimistic UI updates
- Smooth animations

---

## Design Principles

1. **Fast Review:** Parents should be able to approve in 3 taps
2. **Photo-First:** Photos are the primary evidence, make them prominent
3. **Positive Default:** Assume good work, make approval easier than rejection
4. **Clear Consequences:** Show exactly what will happen (payment, Rep change)
5. **Kid-Friendly Feedback:** Review notes should encourage improvement

---

## Next Steps
1. Build `ReviewSubmissionModal` component
2. Create `ParentDashboard` with pending list
3. Wire up approval/rejection logic
4. Test with real submissions
