// V1.5 Sticker System - Credited Minutes with Quality Multipliers
// Makes micro-tasks feel worthwhile while maintaining quality standards

export const DEFAULT_STICKER_MINUTES = 60;
export const DEFAULT_WEEKLY_TARGET_STICKERS = 5;
export const DEFAULT_MONTHLY_TARGET_STICKERS = 20;

export type TaskStatus = 'HONORED' | 'MISSED' | 'PENDING';
export type QualityStars = 1 | 2 | 3 | 4 | 5;

export interface TaskForStickers {
  id: string;
  title: string;
  plannedMinutes: number;
  status: TaskStatus;
  qualityStars?: QualityStars;
  completedAt?: number; // timestamp
  dateString?: string; // YYYY-MM-DD for filtering
}

export interface StickerProgress {
  totalCreditedMinutes: number;
  stickerMinutes: number;
  stickersEarned: number;
  minutesIntoNext: number;
  progressPct: number;
}

export interface WeeklyMonthlyProgress {
  weekly: StickerProgress & {
    targetStickers: number;
    stickersRemaining: number;
  };
  monthly: StickerProgress & {
    targetStickers: number;
    stickersRemaining: number;
  };
}

export interface BonusQualification {
  qualifiesForBonus: boolean;
  requirements: {
    stickerTarget: {
      met: boolean;
      required: number;
      current: number;
    };
    repTarget: {
      met: boolean;
      required: number;
      current: number;
    };
    missedCommitments: {
      met: boolean;
      required: number;
      current: number;
    };
  };
  bonusMultiplier: number;
}

// ============================================================================
// CORE CALCULATION FUNCTIONS (Warp-Ready)
// ============================================================================

/**
 * 1) Quality multiplier for credited minutes
 * 5★ = 1.0x, 4★ = 0.85x, 3★ = 0.5x, <3★ = 0x
 */
export function qualityMultiplier(stars: number): number {
  if (stars >= 5) return 1.0;
  if (stars >= 4) return 0.85;
  if (stars >= 3) return 0.5;
  return 0;
}

/**
 * 2) Calculate credited minutes for a single task
 * Key insight: "2 minutes half-assed" ≠ "2 minutes real work"
 */
export function creditedMinutesForTask(input: {
  plannedMinutes: number;
  status: TaskStatus;
  qualityStars: number;
}): number {
  const { plannedMinutes, status, qualityStars } = input;

  // If not honored, no credit
  if (status !== 'HONORED') return 0;

  // Get quality multiplier
  const mult = qualityMultiplier(qualityStars);
  if (mult <= 0) return 0;

  // Credited minutes cannot exceed planned minutes
  return Math.max(0, Math.min(plannedMinutes, plannedMinutes * mult));
}

/**
 * 3) Turn a list of tasks into "stickers + progress bar"
 * Core V1.5 function that makes micro-tasks feel worthwhile
 */
export function computeStickerProgress(input: {
  tasks: TaskForStickers[];
  stickerMinutes?: number;
}): StickerProgress {
  const stickerMinutes = input.stickerMinutes ?? DEFAULT_STICKER_MINUTES;

  const totalCredited = input.tasks.reduce((sum, task) => {
    const creditedForThisTask = creditedMinutesForTask({
      plannedMinutes: task.plannedMinutes,
      status: task.status,
      qualityStars: task.qualityStars || 3
    });
    return sum + creditedForThisTask;
  }, 0);

  const stickersEarned = Math.floor(totalCredited / stickerMinutes);
  const minutesIntoNext = totalCredited % stickerMinutes;

  return {
    totalCreditedMinutes: Math.round(totalCredited),
    stickerMinutes,
    stickersEarned,
    minutesIntoNext: Math.round(minutesIntoNext),
    progressPct: Math.round((minutesIntoNext / stickerMinutes) * 100),
  };
}

/**
 * 4) Weekly + monthly trackers using the same function
 * Shows 0/5 weekly, 0/20 monthly with progress bars
 */
export function computeWeeklyMonthly(input: {
  weekTasks: TaskForStickers[];
  monthTasks: TaskForStickers[];
  stickerMinutes?: number;
  weeklyTargetStickers?: number;
  monthlyTargetStickers?: number;
}): WeeklyMonthlyProgress {
  const weekly = computeStickerProgress({
    tasks: input.weekTasks,
    stickerMinutes: input.stickerMinutes,
  });

  const monthly = computeStickerProgress({
    tasks: input.monthTasks,
    stickerMinutes: input.stickerMinutes,
  });

  const weeklyTarget = input.weeklyTargetStickers ?? DEFAULT_WEEKLY_TARGET_STICKERS;
  const monthlyTarget = input.monthlyTargetStickers ?? DEFAULT_MONTHLY_TARGET_STICKERS;

  return {
    weekly: {
      ...weekly,
      targetStickers: weeklyTarget,
      stickersRemaining: Math.max(0, weeklyTarget - weekly.stickersEarned),
    },
    monthly: {
      ...monthly,
      targetStickers: monthlyTarget,
      stickersRemaining: Math.max(0, monthlyTarget - monthly.stickersEarned),
    },
  };
}

// ============================================================================
// BONUS QUALIFICATION SYSTEM
// ============================================================================

/**
 * Check if user qualifies for bonuses
 * Requirements: weekly stickers >= 5 AND rep >= 3.5 AND missedCommitments == 0
 */
export function checkBonusQualification(input: {
  weeklyStickersEarned: number;
  weeklyTargetStickers?: number;
  currentRep: number;
  minRepRequired?: number;
  missedCommitments: number;
  maxMissedAllowed?: number;
  strictMode?: boolean;
}): BonusQualification {
  const weeklyTarget = input.weeklyTargetStickers ?? DEFAULT_WEEKLY_TARGET_STICKERS;
  const minRep = input.minRepRequired ?? 3.5;
  const maxMissed = input.maxMissedAllowed ?? 0;

  const stickerTargetMet = input.weeklyStickersEarned >= weeklyTarget;
  const repTargetMet = input.currentRep >= minRep;
  const missedCommitmentsMet = input.missedCommitments <= maxMissed;

  const qualifiesForBonus = stickerTargetMet && repTargetMet && missedCommitmentsMet;

  // Bonus multiplier based on performance
  let bonusMultiplier = 1.0;
  if (qualifiesForBonus) {
    bonusMultiplier = 1.0;
    
    // Extra bonus for exceeding targets
    if (input.weeklyStickersEarned > weeklyTarget) {
      bonusMultiplier += 0.1 * (input.weeklyStickersEarned - weeklyTarget);
    }
    
    // Extra bonus for high rep
    if (input.currentRep >= 4.5) {
      bonusMultiplier += 0.2;
    } else if (input.currentRep >= 4.0) {
      bonusMultiplier += 0.1;
    }
    
    // Perfect week bonus (no missed commitments and high performance)
    if (input.missedCommitments === 0 && input.weeklyStickersEarned >= weeklyTarget * 1.5) {
      bonusMultiplier += 0.15;
    }
  }

  return {
    qualifiesForBonus,
    requirements: {
      stickerTarget: {
        met: stickerTargetMet,
        required: weeklyTarget,
        current: input.weeklyStickersEarned
      },
      repTarget: {
        met: repTargetMet,
        required: minRep,
        current: input.currentRep
      },
      missedCommitments: {
        met: missedCommitmentsMet,
        required: maxMissed,
        current: input.missedCommitments
      }
    },
    bonusMultiplier: Math.round(bonusMultiplier * 100) / 100 // Round to 2 decimals
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current week tasks (Monday to Sunday)
 */
export function getCurrentWeekTasks(allTasks: TaskForStickers[]): TaskForStickers[] {
  const now = new Date();
  const monday = new Date(now);
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
  monday.setDate(now.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return allTasks.filter(task => {
    if (!task.completedAt) return false;
    const taskDate = new Date(task.completedAt);
    return taskDate >= monday && taskDate <= sunday;
  });
}

/**
 * Get current month tasks
 */
export function getCurrentMonthTasks(allTasks: TaskForStickers[]): TaskForStickers[] {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return allTasks.filter(task => {
    if (!task.completedAt) return false;
    const taskDate = new Date(task.completedAt);
    return taskDate >= firstDay && taskDate <= lastDay;
  });
}

/**
 * Get tasks for a specific date range
 */
export function getTasksInRange(
  allTasks: TaskForStickers[], 
  startDate: Date, 
  endDate: Date
): TaskForStickers[] {
  return allTasks.filter(task => {
    if (!task.completedAt) return false;
    const taskDate = new Date(task.completedAt);
    return taskDate >= startDate && taskDate <= endDate;
  });
}

/**
 * Format sticker progress for display
 */
export function formatStickerProgress(progress: StickerProgress): string {
  return `${progress.stickersEarned} stickers (${progress.minutesIntoNext}/${progress.stickerMinutes} min to next)`;
}

/**
 * Get sticker emoji based on count
 */
export function getStickerEmoji(count: number): string {
  if (count === 0) return '⭕';
  if (count <= 2) return '⭐';
  if (count <= 5) return '🌟';
  if (count <= 10) return '✨';
  return '💫';
}

/**
 * Generate sticker slots for UI display
 * Returns array like ['filled', 'filled', 'empty', 'empty', 'empty'] for 2/5
 */
export function generateStickerSlots(earned: number, target: number): ('filled' | 'empty')[] {
  const slots: ('filled' | 'empty')[] = [];
  
  for (let i = 0; i < target; i++) {
    slots.push(i < earned ? 'filled' : 'empty');
  }
  
  return slots;
}

/**
 * Calculate what quality rating is needed for remaining time to hit target
 */
export function calculateRequiredQuality(input: {
  currentMinutes: number;
  targetMinutes: number;
  remainingPlannedMinutes: number;
}): { requiredStars: QualityStars; isAchievable: boolean } {
  const { currentMinutes, targetMinutes, remainingPlannedMinutes } = input;
  const minutesNeeded = targetMinutes - currentMinutes;
  
  if (minutesNeeded <= 0) {
    return { requiredStars: 3, isAchievable: true };
  }
  
  if (remainingPlannedMinutes === 0) {
    return { requiredStars: 5, isAchievable: false };
  }
  
  const requiredMultiplier = minutesNeeded / remainingPlannedMinutes;
  
  if (requiredMultiplier <= 0.5) return { requiredStars: 3, isAchievable: true };
  if (requiredMultiplier <= 0.85) return { requiredStars: 4, isAchievable: true };
  if (requiredMultiplier <= 1.0) return { requiredStars: 5, isAchievable: true };
  
  return { requiredStars: 5, isAchievable: false };
}

// ============================================================================
// MOCK DATA FOR TESTING
// ============================================================================

export const MOCK_TASKS_FOR_STICKERS: TaskForStickers[] = [
  // Aveya - High performer
  { id: '1', title: 'Load dishwasher', plannedMinutes: 5, status: 'HONORED', qualityStars: 5, completedAt: Date.now() - 86400000, dateString: '2025-12-25' },
  { id: '2', title: 'Fold laundry', plannedMinutes: 20, status: 'HONORED', qualityStars: 4, completedAt: Date.now() - 172800000, dateString: '2025-12-24' },
  { id: '3', title: 'Clean bathroom', plannedMinutes: 30, status: 'HONORED', qualityStars: 5, completedAt: Date.now() - 259200000, dateString: '2025-12-23' },
  { id: '4', title: 'Take out trash', plannedMinutes: 3, status: 'HONORED', qualityStars: 4, completedAt: Date.now() - 345600000, dateString: '2025-12-22' },
  { id: '5', title: 'Vacuum living room', plannedMinutes: 15, status: 'HONORED', qualityStars: 5, completedAt: Date.now() - 432000000, dateString: '2025-12-21' },
  
  // Onyx - Learning performer
  { id: '6', title: 'Make bed', plannedMinutes: 5, status: 'HONORED', qualityStars: 3, completedAt: Date.now() - 86400000, dateString: '2025-12-25' },
  { id: '7', title: 'Water plants', plannedMinutes: 3, status: 'MISSED', completedAt: Date.now() - 172800000, dateString: '2025-12-24' },
  { id: '8', title: 'Feed pets', plannedMinutes: 4, status: 'HONORED', qualityStars: 4, completedAt: Date.now() - 259200000, dateString: '2025-12-23' },
  { id: '9', title: 'Organize toys', plannedMinutes: 10, status: 'HONORED', qualityStars: 3, completedAt: Date.now() - 345600000, dateString: '2025-12-22' },
];

/**
 * Example calculation using mock data
 */
export function getMockStickerExample(userId: 'aveya' | 'onyx'): {
  weeklyMonthly: WeeklyMonthlyProgress;
  bonusQualification: BonusQualification;
} {
  // Filter tasks by user (simplified)
  const userTasks = MOCK_TASKS_FOR_STICKERS.filter(task => 
    userId === 'aveya' ? ['1', '2', '3', '4', '5'].includes(task.id) :
    ['6', '7', '8', '9'].includes(task.id)
  );
  
  const weekTasks = getCurrentWeekTasks(userTasks);
  const monthTasks = getCurrentMonthTasks(userTasks);
  
  const weeklyMonthly = computeWeeklyMonthly({
    weekTasks,
    monthTasks
  });
  
  const bonusQualification = checkBonusQualification({
    weeklyStickersEarned: weeklyMonthly.weekly.stickersEarned,
    currentRep: userId === 'aveya' ? 4.6 : 3.2, // Mock rep scores
    missedCommitments: userId === 'aveya' ? 0 : 1
  });
  
  return {
    weeklyMonthly,
    bonusQualification
  };
}