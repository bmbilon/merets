// Utility functions for calculating earnings by time period

export interface Commitment {
  id: string;
  kidId: string;
  title: string;
  details?: string;
  date: string;
  effortMin: number;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'MISSED';
  createdAt: number;
  approvedAt?: number;
  decidedAt?: number;
  decidedBy?: 'MOM' | 'DAD';
  skillId?: string;
  payCents?: number; // Adding pay tracking
}

export interface Kid {
  id: string;
  name: string;
  stickerCount: number;
  lifetimeStickers: number;
  balanceCents: number;
  streakDays: number;
  lastStickerDate?: string;
}

// Helper function to get today's date string
export function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper function to get week key (ISO week)
export function weekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThu = new Date(target.getFullYear(), 0, 4);
  const firstDayNr = (firstThu.getDay() + 6) % 7;
  firstThu.setDate(firstThu.getDate() - firstDayNr + 3);
  const weekNo = 1 + Math.round((target.getTime() - firstThu.getTime()) / (7 * 24 * 3600 * 1000));
  return `${target.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// Helper function to get month key
export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

// Calculate estimated pay from effort minutes (fallback for old commitments)
export function calculatePayFromEffort(effortMin: number): number {
  // Micro-tasks (≤5 min) = $3
  if (effortMin <= 5) {
    return 300; // $3.00 in cents
  }
  
  // Standard rate: roughly $4/hour = ~$0.067/minute
  // Minimum $2 for any task
  return Math.max(200, Math.round(effortMin * 6.7));
}

// Get total earnings for a user
export function getTotalEarnings(kid: Kid): number {
  return kid.balanceCents;
}

// Get earnings for today
export function getEarningsToday(commitments: Commitment[], kidId: string): number {
  const today = todayStr();
  
  return commitments
    .filter(c => 
      c.kidId === kidId && 
      c.date === today && 
      c.status === 'COMPLETED'
    )
    .reduce((total, c) => {
      const pay = c.payCents || calculatePayFromEffort(c.effortMin);
      return total + pay;
    }, 0);
}

// Get earnings for this week
export function getEarningsThisWeek(commitments: Commitment[], kidId: string): number {
  const thisWeek = weekKey(todayStr());
  
  return commitments
    .filter(c => 
      c.kidId === kidId && 
      weekKey(c.date) === thisWeek && 
      c.status === 'COMPLETED'
    )
    .reduce((total, c) => {
      const pay = c.payCents || calculatePayFromEffort(c.effortMin);
      return total + pay;
    }, 0);
}

// Get earnings for this month
export function getEarningsThisMonth(commitments: Commitment[], kidId: string): number {
  const thisMonth = monthKey(todayStr());
  
  return commitments
    .filter(c => 
      c.kidId === kidId && 
      monthKey(c.date) === thisMonth && 
      c.status === 'COMPLETED'
    )
    .reduce((total, c) => {
      const pay = c.payCents || calculatePayFromEffort(c.effortMin);
      return total + pay;
    }, 0);
}

// Get total commitments honored (completed)
export function getTotalCommitmentsHonored(commitments: Commitment[], kidId: string): number {
  return commitments.filter(c => 
    c.kidId === kidId && 
    c.status === 'COMPLETED'
  ).length;
}

// Get current streak days (consecutive days with at least one completed commitment)
export function getCurrentStreakDays(commitments: Commitment[], kidId: string): number {
  const completedDates = commitments
    .filter(c => c.kidId === kidId && c.status === 'COMPLETED')
    .map(c => c.date)
    .sort()
    .reverse(); // Most recent first

  if (completedDates.length === 0) return 0;

  let streak = 0;
  const today = todayStr();
  let currentDate = new Date();

  // Check if they completed something today
  const todayCompleted = completedDates.includes(today);
  
  // Start from today or yesterday
  if (todayCompleted) {
    streak = 1;
  } else {
    // Check yesterday
    currentDate.setDate(currentDate.getDate() - 1);
    const yesterday = currentDate.toISOString().split('T')[0];
    if (completedDates.includes(yesterday)) {
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      return 0; // No recent activity
    }
  }

  // Count backwards day by day
  while (true) {
    const checkDate = currentDate.toISOString().split('T')[0];
    if (completedDates.includes(checkDate)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Summary stats interface
export interface UserEarningsStats {
  totalEarningsCents: number;
  earnedTodayCents: number;
  earnedWeekCents: number;
  earnedMonthCents: number;
  totalCommitmentsHonored: number;
  currentStreakDays: number;
}

// Get all earnings stats for a user
export function getUserEarningsStats(kid: Kid, commitments: Commitment[]): UserEarningsStats {
  return {
    totalEarningsCents: getTotalEarnings(kid),
    earnedTodayCents: getEarningsToday(commitments, kid.id),
    earnedWeekCents: getEarningsThisWeek(commitments, kid.id),
    earnedMonthCents: getEarningsThisMonth(commitments, kid.id),
    totalCommitmentsHonored: getTotalCommitmentsHonored(commitments, kid.id),
    currentStreakDays: getCurrentStreakDays(commitments, kid.id)
  };
}