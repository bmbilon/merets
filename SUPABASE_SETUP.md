# 🚀 Ments Supabase Backend Setup

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Name: **"ments"** (or "ments-app")
4. Choose your organization and region (US East for fastest performance)
5. Create a secure database password and save it
6. Wait for project to initialize (~2 minutes)

## Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy your **Project URL** 
3. Copy your **anon public** key
4. Update `lib/supabase.ts` with these values:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'
```

## Step 3: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste into SQL Editor and click **"Run"**
4. You should see: "Success. No rows returned"

## Step 4: Seed Database with Initial Data

1. Still in **SQL Editor**, create a new query
2. Copy the contents of `supabase/seed.sql`
3. Paste and click **"Run"**
4. You should see success messages for all INSERT statements

## Step 5: Verify Database Setup

Go to **Table Editor** and confirm these tables exist with data:
- ✅ `user_profiles` (4 family members: Aveya, Onyx, Lauren, Brett)
- ✅ `pay_rates` (24 rows: 6 skills × 4 difficulty levels)
- ✅ `task_templates` (35+ tasks: micro-tasks and standard tasks)
- ✅ `commitments` (empty, ready for user data)
- ✅ `chat_messages` (empty, ready for family chat)

## Step 6: Test Connection

Run the app and check if data loads:
```bash
npm start
```

The app should now pull task suggestions and pay rates from your Supabase database instead of hardcoded values!

---

## 🎯 What This Backend Provides

### **Dynamic Task Library**
- **Micro-tasks** (2-5 min): Take out trash ($3), Load dishwasher ($3), Water plants ($3.50)
- **Standard tasks** (15+ min): Deep clean bathroom ($9), Mow lawn ($18), Organize garage ($36)
- **Searchable**: Find tasks by keyword
- **Categorized**: By skill (Cleaning, Dishes, Laundry, Cooking, Yard, Tools)

### **Smart Pay Calculations**
- **Skill-based rates**: Different rates per skill category
- **Difficulty scaling**: 4 levels from Helper to Master
- **Micro vs Standard**: Flat rates for quick tasks, per-minute for longer ones
- **Auto-calculation**: No more manual pricing guesswork

### **Real-time Family System**
- **User profiles**: Track each family member's progress and earnings
- **Live chat**: Persistent family conversation history
- **Commitment tracking**: Full lifecycle from request → approval → completion

### **Backend Features**
- **Database-driven dropdowns**: Task suggestions from real data
- **Persistent storage**: All progress and earnings saved
- **Scalable**: Easy to add new tasks and adjust pay rates
- **Type-safe**: Full TypeScript integration

---

## 🔧 Backend Architecture

```
Frontend (React Native)
    ↓
SupabaseService (lib/supabase-service.ts)
    ↓
Supabase Client (lib/supabase.ts)
    ↓
PostgreSQL Database (5 tables)
```

Ready to build the **"Addictive as Roblox, earning real money"** experience! 🎮💰