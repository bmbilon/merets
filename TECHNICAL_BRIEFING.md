# 🎯 Ments Technical Briefing
**Gamified Family Commitment Tracking & Task Marketplace**

---

## 📋 Executive Summary

**Ments** (short for "commitments") is a gamified family task management and commitment tracking application that has evolved from basic commitment tracking into a comprehensive marketplace-style system with mobile game-like UI elements. The app successfully combines behavioral psychology with modern mobile UX patterns to create an "addictive as Roblox, earning real money" experience for children while providing parents comprehensive administrative control.

### 🚀 **New: Ment Contracts**
Borrowed from finance apps, every task claiming now requires formal contract acceptance with detailed terms, quality standards, and level requirements - adding professionalism and accountability to the gamified experience.

## 🏗️ System Architecture

### **Technology Stack**
- **Frontend**: React Native (Expo 54.x) with TypeScript
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **State Management**: React hooks with AsyncStorage fallback
- **UI Framework**: React Native Paper + Custom Components
- **Development**: Expo Router (file-based routing)
- **Platform**: Cross-platform (iOS/Android/Web)

### **Database Schema (Supabase)**
```
user_profiles → Primary user data (kids, parents)
task_templates → Reusable task definitions with marketplace data
commitments → Active tasks claimed/assigned to users
task_priorities → Parent-set priority overrides & custom pricing
task_assignments → Marketplace task allocation tracking
pay_rates → Skill-based pay calculation matrix
chat_messages → Family communication system
```

### **Key Database Functions**
- `get_marketplace_tasks()` - Filtered task retrieval with priority calculations
- `get_prioritized_tasks_for_display()` - Gamified tile display ordering
- `claim_marketplace_task()` - Atomic task claiming with validation
- `available_tasks_for_kids` - Real-time view of claimable tasks

---

## 🎮 Core Features & User Experience

### **1. Kids Dashboard (Aveya/Onyx)**
#### **Gamified Task Display**
- **Visual Progress Tracking**: Animated progress bars, streak counters, XP accumulation
- **Game-Like UI Elements**: 
  - Color-coded skill categories (Cleaning: Green, Dishes: Blue, etc.)
  - Difficulty badges (Helper → Expert → Master)
  - Instant reward animations with haptic feedback
  - Achievement unlocks and milestone celebrations

#### **Ment Mall (Marketplace)**
- **Browse Available Tasks**: Real-time filtered view of parent-approved tasks
- **Expandable Task Cards**: Compressed view shows key data, expands for full details
- **Smart Sorting**: Default by due date, options for pay, difficulty, time
- **Visual Priority Indicators**: Color-coded urgency levels, pay multipliers
- **🆕 Ment Contracts**: Finance app-style contract confirmation before task claiming
- **Level Gating**: Tasks show required skill levels and prevent claiming if under-qualified

#### **Ment Creation**
- **Quick Task Selection**: Pre-populated dropdown from database templates
- **Custom Tasks**: Free-form title/description with effort estimation
- **Skill Association**: Link tasks to skill categories for proper pay calculation
- **Smart Pay Calculation**: Auto-calculates pay based on effort + skill + difficulty
- **🆕 Contract Confirmation**: All ments require formal acceptance via contract screen

### **2. Parent Dashboard**
#### **Ment Mall Management**
- **Complete CRUD Operations**: Create, edit, delete any task template
- **Priority System**: Set urgency levels with custom pay multipliers
- **Availability Control**: Toggle task visibility to kids
- **Assignment Limits**: Control how many kids can claim same task
- **Due Date Management**: Set deadlines with automatic filtering
- **Level Requirements**: Set minimum skill levels required for each task

#### **Admin Controls**
- **Real-time Approval**: Approve/reject ments with quality ratings
- **Pay Rate Management**: Adjust skill-based pay matrices
- **Performance Analytics**: Track completion rates, earnings, progress
- **Family Chat Integration**: Persistent messaging system

### **3. Gamification Systems**
#### **Instant Rewards**
- **Immediate XP**: Points awarded on task completion
- **Skill Progression**: Level up individual skill categories
- **Streak Tracking**: Daily/weekly completion streaks
- **Achievement Badges**: Milestone rewards and special recognition
- **Haptic Feedback**: Physical reward sensation on interactions

#### **Visual Progress Systems**
- **Weekly Progress Bubbles**: Visual week-at-a-glance completion status
- **Monthly Progress Slider**: Long-term progress tracking
- **Streak Visualizer**: Gamified streak display with bonus multipliers
- **Earnings Calculator**: Real-time balance updates with visual celebration

---

## 🎨 UI/UX Design Patterns

### **Color Psychology & Visual Hierarchy**
```typescript
// User-Specific Color Schemes
Aveya: Primary: "#E91E63" (Pink/Magenta) - Energetic, Creative
Onyx:  Primary: "#2E7D32" (Deep Green) - Growth, Achievement
Parent: Primary: "#1976D2" (Professional Blue) - Authority, Trust
```

### **Mobile-First Design Principles**
1. **Safe Area Handling**: Proper iOS notch/Dynamic Island support
2. **Touch Targets**: Minimum 44px touch zones for all interactive elements
3. **Gesture Support**: Swipe navigation, pull-to-refresh, tap-to-expand
4. **Responsive Layout**: Adapts to different screen sizes and orientations

### **Game UI Patterns**
1. **Progress Visualization**: Animated bars, circular progress, completion badges
2. **Reward Feedback**: Celebratory animations, confetti effects, sound cues
3. **Achievement Display**: Unlockable content, milestone celebrations
4. **Social Elements**: Family leaderboards, shared achievements

---

## 📱 Wireframes & User Flows

### **Kids Dashboard Wireframe**
```
┌─────────────────────────────┐
│  👋 Hi Aveya!   🏆 Level 3  │
│  💰 $24.50     ⚡ 45 XP     │
├─────────────────────────────┤
│  📊 PROGRESS THIS WEEK      │
│  ●●●●○○○ (5/7 days)         │
│  🔥 3 day streak!           │
├─────────────────────────────┤
│  🛒 MENT MALL              │
│  ┌────────────────────────┐ │
│  │ 🧽 Deep Clean Bathroom │ │
│  │ 💰 $9.00 | ⏱️ 30min   │ │
│  │ 🔴 Urgent | Level 2+   │ │
│  │    [Review Ment] 📋    │ │
│  └────────────────────────┘ │
├─────────────────────────────┤
│  📝 MY MENTS               │
│  ✅ Kitchen cleanup         │
│  🕐 Load dishwasher (2h)    │
│  ⏰ Homework due tomorrow   │
├─────────────────────────────┤
│  💬 FAMILY CHAT  📋 CREATE │
└─────────────────────────────┘
```

### **Parent Admin Wireframe**
```
┌─────────────────────────────┐
│  🔐 PARENT DASHBOARD        │
├─────────────────────────────┤
│  📊 FAMILY OVERVIEW         │
│  Aveya: 5 tasks | $24.50    │
│  Onyx:  3 tasks | $18.00    │
├─────────────────────────────┤
│  🛒 TASK MALL MANAGEMENT    │
│  ┌─────────────┐            │
│  │ MANAGE TASKS│  📋 Priorities│
│  └─────────────┘            │
├─────────────────────────────┤
│  ⚡ PENDING APPROVALS (3)   │
│  ┌─Aveya: Clean bathroom─┐   │
│  │ ✅ Approve  ❌ Reject │   │
│  └────────────────────────┘   │
├─────────────────────────────┤
│  📈 ANALYTICS              │
│  This Week: 12 completed    │
│  Total Earned: $156.50      │
└─────────────────────────────┘
```

### **Ment Mall Admin Interface**
```
┌─────────────────────────────┐
│  🏪 MENT MALL ADMIN        │
│  🔍 [Search...]  + CREATE   │
├─────────────────────────────┤
│  📊 FILTERS & SORTING       │
│  💰 Pay | ⏱️ Time | 🎯 Priority │
├─────────────────────────────┤
│  TASK TEMPLATES             │
│  ┌─────────────────────────┐ │
│  │ 🧽 Deep Clean Bathroom  │ │
│  │ 💰 $9.00 | ⏱️ 30min | 🔴│ │
│  │ Available: ✅ | Due: 2d │ │
│  │ [Edit] [Delete] [Hide] │ │
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │ 🍽️ Load Dishwasher     │ │
│  │ 💰 $3.00 | ⏱️ 5min | 🟡 │ │
│  │ Available: ✅ | No Due  │ │
│  │ [Edit] [Delete] [Hide] │ │
│  └─────────────────────────┘ │
└─────────────────────────────┘
```

### **🆕 Ment Contract Screen**
```
┌─────────────────────────────┐
│     📋 Ment Contract        │
│   You are committing to:    │
├─────────────────────────────┤
│ • Task: Deep Clean Bathroom │
│ • Skill: 🧽 Cleaning        │
│ • Level Required: 2+ Skilled│
│ • Time: 30 min              │
│ • Pay: $9.00                │
│ • Due: Tomorrow             │
│ • Quality Standard: Perfect │
├─────────────────────────────┤
│      🚨 URGENT TASK         │
├─────────────────────────────┤
│ 📝 Parent Notes:            │
│ Must scrub tub thoroughly   │
├─────────────────────────────┤
│  [Decline]  [Accept Ment]   │
└─────────────────────────────┘
```

---

## 🔧 Technical Implementation Details

### **State Management Pattern**
```typescript
// Hybrid local/remote state management
interface Store {
  kids: Kid[]                    // Local cache with remote sync
  commitments: Commitment[]      // Real-time database sync
  taskLibrary: TaskTemplate[]   // Database-driven dropdowns
  lastBonusPaid: BonusTracker   // Local bonus calculation state
}

// Database-first with AsyncStorage fallback
const useStore = () => {
  const [store, setStore] = useState<Store | null>(null)
  
  useEffect(() => {
    loadStore().then(setStore)  // AsyncStorage → Database
  }, [])
  
  const persist = async (next: Store) => {
    setStore(next)              // Update UI immediately
    await saveStore(next)       // Persist locally
    await syncToDatabase(next)  // Sync to Supabase
  }
  
  return { store, persist }
}
```

### **Pay Calculation System**
```typescript
// Multi-tier pay calculation with overrides
const calculateEffectivePay = (task: TaskTemplate, priority?: TaskPriority): number => {
  // Base pay from template
  let basePay = task.base_pay_cents
  
  // Priority override (parent admin)
  if (priority?.custom_pay_cents) {
    basePay = priority.custom_pay_cents
  }
  
  // Urgency multiplier
  const urgencyMultiplier = task.urgency_multiplier || 1.0
  
  // Skill-based calculation for custom tasks
  if (task.is_micro_task) {
    return basePay * urgencyMultiplier
  } else {
    return Math.round(task.effort_minutes * getSkillRate(task.skill_category) * urgencyMultiplier)
  }
}
```

### **Real-time Marketplace Updates**
```typescript
// Database view with computed fields
CREATE VIEW available_tasks_for_kids AS
SELECT 
  tt.*,
  tp.priority_type,
  tp.is_urgent,
  COALESCE(tp.custom_pay_cents, tt.base_pay_cents) * tt.urgency_multiplier as effective_pay_cents,
  CASE 
    WHEN tp.priority_type = 'urgent' THEN 100
    WHEN tp.priority_type = 'high' THEN 75
    ELSE 50
  END as urgency_score,
  tt.due_date - CURRENT_DATE as days_until_due
FROM task_templates tt
LEFT JOIN task_priorities tp ON tt.id = tp.task_template_id
WHERE tt.is_available_for_kids = true
```

---

## 🚀 Current Status & Deployment

### **Development Environment**
- **Server**: Expo Development Server (http://localhost:8081)
- **Database**: Supabase Cloud (Fully configured with sample data)
- **Testing**: iOS Simulator + Web Interface + QR Code mobile testing

### **Completed Features** ✅
1. **Complete Database Schema**: All tables, functions, views, and sample data
2. **Kids Interface**: Full dashboard with Task Mall integration
3. **Parent Admin Portal**: Complete CRUD operations for task management
4. **Real-time Sync**: Database connectivity with error handling
5. **User ID Mapping**: Resolution system for hardcoded IDs to UUIDs
6. **iOS Safe Area**: Proper handling of notch/Dynamic Island
7. **Priority System**: Parent-controlled task urgency and custom pricing

### **Next Phase Priorities** 🎯
1. **Testing & Polish**: Comprehensive user testing of all features
2. **Performance Optimization**: Loading states, error boundaries, offline support  
3. **Advanced Gamification**: Achievement system, leaderboards, bonus calculations
4. **Push Notifications**: Task reminders, approval notifications
5. **Analytics Dashboard**: Performance tracking, usage metrics
6. **Production Deployment**: App Store submission, production database

---

## 🛠️ Developer Handoff Notes

### **Key Files to Understand**
```
📁 app/(tabs)/
  ├── aveya-dashboard.tsx     # Main kids interface
  ├── onyx-dashboard.tsx      # Duplicate with different theming
  └── parent.tsx              # Parent authentication & admin access

📁 components/
  ├── TaskMarketplace.tsx     # Kids task browsing & claiming
  ├── TaskMallAdmin.tsx       # Parent task management CRUD
  ├── GameifiedTaskTiles.tsx  # Visual progress components
  └── ParentAdminPortal.tsx   # Original admin interface

📁 lib/
  ├── supabase-service.ts     # Primary database operations
  ├── supabase-parent-service.ts # Parent-specific admin functions
  ├── user-id-mapping.ts      # UUID resolution system
  └── systems/
      ├── gamification-system.ts # XP, levels, achievements
      ├── skills-system.ts       # Skill categories & progression
      └── instant-rewards.tsx    # Animation & feedback systems
```

### **Environment Setup**
1. **Supabase Configuration**: Update `lib/supabase.ts` with production credentials
2. **Development Server**: `npx expo start` (already working)
3. **Database Migrations**: Located in `/supabase/migrations/` (already applied)
4. **Testing**: Use iOS Simulator or scan QR code with Expo Go

### **Critical Business Logic**
1. **Task Claiming**: Atomic operations with assignment limits and availability checks
2. **Pay Calculations**: Multi-tier system (base + skill + difficulty + urgency + parent overrides)
3. **User Authentication**: Simple password-based parent access (ready for upgrade to proper auth)
4. **Real-time Updates**: Database functions handle complex sorting and filtering

---

## 📈 Success Metrics & Goals

### **User Engagement Metrics**
- **Daily Active Users**: Target 80%+ family engagement
- **Task Completion Rate**: >70% claimed tasks completed
- **Session Time**: 5+ minutes average per kid session
- **Return Rate**: Daily app opens for task checking

### **Business Value Metrics**
- **Family Satisfaction**: Reduced household friction
- **Educational Value**: Responsibility and work ethic development
- **Financial Literacy**: Real money earned through task completion
- **Parent Control**: Administrative efficiency and oversight capability

---

*This technical briefing provides a comprehensive overview for a senior engineer to quickly understand the Kidmitment system architecture, current implementation status, and future development priorities.*