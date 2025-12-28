# Ments Canonical Terminology

**Status:** 🔒 LOCKED IN  
**Version:** 1.0  
**Date:** 2025-12-26

---

## Core Concepts

| Concept | Term | Usage | DB Column | Notes |
|---------|------|-------|-----------|-------|
| Person doing work | **earner** | "Aveya is an earner in our household" | `earner_id` | Replaces "kid", "child", "seeker" |
| Person approving/paying | **provider** | "Brett is a provider who posts tasks" | `role='provider'` | Replaces "parent", "payer" |
| Neutral identity | **user** | "Each user has a profile" | `user_id` | Generic reference to any person |
| Core unit of effort | **Merets** | "Earned 2.5 Merets today" | `merets_balance` | ~1 Meret per hour of work |
| Reputation score | **Rep** | "Current Rep: 3.85 stars" | `rep_stars` | 1.00–5.00 star rating |
| Commitment | **Ment** | "Accepted a new Ment" | `commitments` | Shorthand in UI (full: commitment) |

---

## Role System

We encode **role**, not identity.

### member_role enum:
- `provider` - Posts tasks, reviews work, approves payments
- `earner` - Claims tasks, submits work, earns Merets/Rep
- `admin` - Full access (can be both provider + earner)

### Examples:
- ✅ "Earners can view available Ments"
- ✅ "Providers review submissions and assign Rep"
- ❌ "Kids complete tasks" (too age-specific)
- ❌ "Parents pay for chores" (assumes family context)

---

## Database Schema

### Tables Using Canonical Terms:

**ledger_events**
```sql
earner_id uuid     -- person who earned Merets/Rep
actor_id uuid      -- person who triggered the event
```

**household_members**
```sql
role member_role   -- 'provider' | 'earner' | 'admin'
```

**Views**
```sql
v_earner_earnings_summary  -- earnings grouped by earner
```

### Deprecated Terms (avoid in new code):
- ❌ `kid_id` (use `earner_id`)
- ❌ `parent` role (use `provider`)
- ❌ `seeker` (use `earner`)

---

## UI Language

### Dashboard Headers
- **Earner Dashboard**: "Your Ments" | "Available Work" | "Merets: 12.5"
- **Provider Dashboard**: "Review Ments" | "Post New Task" | "Family Stats"

### Buttons & Actions
- "Accept Ment"
- "Submit for Review"
- "Award Merets"
- "Update Rep"
- "Mark Paid"

### Notifications
- "You earned 1.2 Merets! 🎉"
- "Rep increased to 4.15 ⭐"
- "New Ment available: Dishes"
- "Provider reviewed your work: 5 stars!"

---

## Code Examples

### TypeScript Interfaces
```typescript
export interface LedgerEvent {
  earner_id?: string        // ✅ canonical
  actor_id?: string         // ✅ who caused the event
  merets_delta?: number     // ✅ Merets earned/spent
  rep_delta?: number        // ✅ Rep change
}

export interface HouseholdMember {
  role: 'provider' | 'earner' | 'admin'  // ✅ canonical
}
```

### Query Examples
```sql
-- ✅ Good: canonical terminology
select earner_id, sum(merets_delta) as total_merets
from ledger_events
where kind = 'merets'
group by earner_id;

-- ❌ Avoid: deprecated terminology
select kid_id, sum(merets_delta)  -- don't use kid_id
from ledger_events;
```

---

## Migration Notes

### Backward Compatibility
During transition, both terms may coexist:
- `commitments.user_id` → feeds `ledger_events.earner_id`
- Old code can reference `user_id` until updated
- New code should use `earner_id` in ledger queries

### Search & Replace Rules
When refactoring:
1. `kid` → `earner` (in most contexts)
2. `parent` → `provider` (in role contexts)
3. `child` → `earner` (avoid age-specific language)
4. `family` → `household` (more flexible)

---

## Future Extensibility

This terminology supports future features:

### Marketplace Expansion
- **Providers** can be parents, neighbors, or businesses
- **Earners** can be kids, teens, or adults seeking gigs
- Platform stays age-neutral and context-flexible

### Multi-Household
- User can be `earner` in household A
- Same user can be `provider` in household B
- Role is contextual, not identity-based

### Educational Context
- Teachers as `providers` posting assignments
- Students as `earners` completing work
- Merets track academic effort, not just chores

---

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│ MENTS TERMINOLOGY QUICK REF                │
├─────────────────────────────────────────────┤
│ earner     = person doing work             │
│ provider   = person posting/approving work  │
│ user       = any person (neutral)           │
│ Merets     = effort currency (~1/hour)      │
│ Rep        = reputation (1-5 stars)         │
│ Ment       = commitment (task)              │
├─────────────────────────────────────────────┤
│ DB COLUMNS:                                 │
│   earner_id, actor_id, merets_delta,        │
│   rep_delta, member_role                    │
└─────────────────────────────────────────────┘
```

---

## Enforcement

### Code Review Checklist
- [ ] No use of deprecated terms (kid, parent, child)
- [ ] Roles use canonical enum: provider/earner/admin
- [ ] DB queries reference earner_id (not kid_id)
- [ ] UI text uses Merets/Rep/Ment terminology
- [ ] Comments explain roles, not identities

### Linting (future)
Add eslint/tslint rules to flag:
- Variables named `kid*` or `parent*`
- String literals containing "child" or "family member"
- Database queries using deprecated column names

---

**Built with intentional language for an inclusive, scalable platform.**
