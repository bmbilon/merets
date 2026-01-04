# Notification Type Contract

## Rule: Notification Types Are Canonical

Notification types are **defined in the database**, not invented in application code.

### ✅ Correct Process:

1. **Add type to database FIRST** (via migration or lookup table)
2. **Then use it in functions/code**

### ❌ Wrong Process:

1. ~~Use new type in function~~
2. ~~Hope it works~~
3. ~~Get constraint violation error~~

---

## Current Canonical Types (Verified)

Based on constraint check from actual database:

```
task_assigned
task_completed
task_approved          ← Used in approve_submission
task_rejected
payment_received
achievement_unlocked
reminder
system
```

---

## Before Tightening Constraints

**ALWAYS run sanity check first:**

```sql
SELECT notification_type, COUNT(*) 
FROM notifications 
GROUP BY notification_type 
ORDER BY COUNT DESC;
```

**If legacy types exist:**
- Option A: Migrate them first (`UPDATE notifications SET notification_type = 'task_approved' WHERE notification_type = 'work_approved'`)
- Option B: Include them in allowed set temporarily

**Allowed Set = Canonical 8 + Any Legacy Types Currently Stored**

---

## Better Solution: Lookup Table

Instead of `CHECK` constraint surgery, use a lookup table:

### Benefits:
- ✅ No constraint drop/recreate loop
- ✅ Easy to add new types
- ✅ Self-documenting
- ✅ Can track metadata (description, is_legacy, etc.)

### Migration:

```sql
-- 1. Create lookup table
CREATE TABLE notification_types (
  type TEXT PRIMARY KEY,
  description TEXT,
  is_legacy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Populate canonical types
INSERT INTO notification_types (type) VALUES
  ('task_assigned'),
  ('task_completed'),
  ('task_approved'),
  ('task_rejected'),
  ('payment_received'),
  ('achievement_unlocked'),
  ('reminder'),
  ('system');

-- 3. Add any legacy types that exist
INSERT INTO notification_types (type, is_legacy) 
SELECT DISTINCT notification_type, true
FROM notifications
WHERE notification_type NOT IN (
  'task_assigned', 'task_completed', 'task_approved', 'task_rejected',
  'payment_received', 'achievement_unlocked', 'reminder', 'system'
);

-- 4. Replace CHECK with FK
ALTER TABLE notifications DROP CONSTRAINT notifications_notification_type_check;
ALTER TABLE notifications ADD CONSTRAINT fk_notification_type
  FOREIGN KEY (notification_type) REFERENCES notification_types(type);
```

### Adding New Types:

```sql
-- Simple insert, no constraint surgery
INSERT INTO notification_types (type, description) 
VALUES ('new_type', 'Description of new type');
```

---

## Contract Rules

1. **Never invent notification_type strings in functions**
2. **Always check allowed types before using**
3. **Add to database first, use in code second**
4. **Don't tighten constraints until legacy data is migrated**
5. **Prefer lookup table over CHECK constraint**

---

## Current Status

- ✅ `approve_submission` uses `task_approved`
- ✅ `task_approved` verified in constraint
- ✅ Function is production-ready
- ⚠️ Need to verify no legacy types exist in prod
- 🔄 Consider migrating to lookup table

---

## If Constraint Error Occurs

**Error:** `new row for relation "notifications" violates check constraint "notifications_notification_type_check"`

**This means:**
- Schema drift occurred
- Someone removed the type from allowed set
- NOT a function bug

**Fix:**
1. Run sanity check to see what types exist
2. Add missing type back to constraint OR
3. Migrate to lookup table approach
