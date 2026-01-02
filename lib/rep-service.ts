/**
 * Rep (Reputation) Service
 * Handles all Rep-related calculations, display, and privileges
 */

export interface RepTier {
  score: number;
  title: string;
  tier: 'unranked' | 'entry' | 'active' | 'meritous' | 'virtuous' | 'exceptional';
  abbrev: string;
  color: string;
  description: string;
}

export interface RepPrivileges {
  canAutoApprove: boolean;
  canInstantPay: boolean;
  payMultiplier: number;
  requiresManualApproval: boolean;
}

export interface RepStats {
  score: number;
  title: string;
  tier: string;
  abbrev: string;
  totalCommitments: number;
  completedCommitments: number;
  failedCommitments: number;
  completionRate: number;
  averageQuality: number;
  consistencyScore: number;
}

/**
 * Get Rep tier information for a given Rep score
 */
export function getRepTier(rep: number): RepTier {
  // Unranked (0-9)
  if (rep >= 0 && rep <= 9) {
    return {
      score: rep,
      title: 'Unranked',
      tier: 'unranked',
      abbrev: '—',
      color: '#9E9E9E',
      description: 'New or unproven'
    };
  }
  
  // Entry & Early Progression (10-19)
  if (rep === 10) {
    return {
      score: rep,
      title: 'Entry Earner',
      tier: 'entry',
      abbrev: '1E',
      color: '#4CAF50',
      description: 'Has begun earning'
    };
  }
  if (rep >= 11 && rep <= 19) {
    return {
      score: rep,
      title: 'Entry Earner Progression',
      tier: 'entry',
      abbrev: `1E${rep - 10}`,
      color: '#4CAF50',
      description: 'Learning reliability'
    };
  }
  
  // Active Participation (20-49)
  if (rep === 20) {
    return {
      score: rep,
      title: 'Active Earner',
      tier: 'active',
      abbrev: '2E',
      color: '#2196F3',
      description: 'Regularly completes tasks'
    };
  }
  if (rep >= 21 && rep <= 29) {
    return {
      score: rep,
      title: 'Active Progression',
      tier: 'active',
      abbrev: `2E${rep - 20}`,
      color: '#2196F3',
      description: 'Building consistency'
    };
  }
  if (rep === 30) {
    return {
      score: rep,
      title: 'Established Earner',
      tier: 'active',
      abbrev: '3E',
      color: '#2196F3',
      description: 'Dependable'
    };
  }
  if (rep >= 31 && rep <= 39) {
    return {
      score: rep,
      title: 'Established Progression',
      tier: 'active',
      abbrev: `3E${rep - 30}`,
      color: '#2196F3',
      description: 'Trusted for routine tasks'
    };
  }
  if (rep === 40) {
    return {
      score: rep,
      title: 'Advanced Earner',
      tier: 'active',
      abbrev: '4E',
      color: '#2196F3',
      description: 'High reliability'
    };
  }
  if (rep >= 41 && rep <= 49) {
    return {
      score: rep,
      title: 'Advanced Progression',
      tier: 'active',
      abbrev: `4E${rep - 40}`,
      color: '#2196F3',
      description: 'Near-elite consistency'
    };
  }
  
  // Meritous Tier (50-79)
  if (rep === 50) {
    return {
      score: rep,
      title: 'Meritous Earner',
      tier: 'meritous',
      abbrev: '5M',
      color: '#9C27B0',
      description: 'Reputation precedes them'
    };
  }
  if (rep >= 51 && rep <= 59) {
    return {
      score: rep,
      title: 'Meritous Progression',
      tier: 'meritous',
      abbrev: `5M${rep - 50}`,
      color: '#9C27B0',
      description: 'Trusted without oversight'
    };
  }
  if (rep >= 60 && rep <= 69) {
    return {
      score: rep,
      title: 'Senior Meritous',
      tier: 'meritous',
      abbrev: `6M${rep - 60}`,
      color: '#9C27B0',
      description: 'Rare reliability'
    };
  }
  if (rep >= 70 && rep <= 79) {
    return {
      score: rep,
      title: 'Elite Meritous',
      tier: 'meritous',
      abbrev: `7M${rep - 70}`,
      color: '#9C27B0',
      description: 'Exceptional consistency'
    };
  }
  
  // Virtuous Tier (80-89)
  if (rep === 80) {
    return {
      score: rep,
      title: 'Virtuous Earner',
      tier: 'virtuous',
      abbrev: '8V',
      color: '#FF9800',
      description: 'Work accepted automatically'
    };
  }
  if (rep >= 81 && rep <= 89) {
    return {
      score: rep,
      title: 'Virtuous Progression',
      tier: 'virtuous',
      abbrev: `8V${rep - 80}`,
      color: '#FF9800',
      description: 'Near-flawless execution'
    };
  }
  
  // Exceptional Tier (90-99)
  if (rep === 90) {
    return {
      score: rep,
      title: 'Exceptionally Meretous',
      tier: 'exceptional',
      abbrev: '9X',
      color: '#FFD700',
      description: 'Word is gold'
    };
  }
  if (rep >= 91 && rep <= 94) {
    return {
      score: rep,
      title: 'Exceptional Progression',
      tier: 'exceptional',
      abbrev: `9X${rep - 90}`,
      color: '#FFD700',
      description: 'Legendary reliability'
    };
  }
  if (rep === 95) {
    return {
      score: rep,
      title: 'Exceptionally Masterful',
      tier: 'exceptional',
      abbrev: '95XM',
      color: '#FFD700',
      description: 'Platform elite'
    };
  }
  if (rep >= 96 && rep <= 99) {
    return {
      score: rep,
      title: 'Mythic Progression',
      tier: 'exceptional',
      abbrev: `9${rep}`,
      color: '#FFD700',
      description: 'Approaching perfection'
    };
  }
  
  // Default fallback
  return {
    score: rep,
    title: 'Unranked',
    tier: 'unranked',
    abbrev: '—',
    color: '#9E9E9E',
    description: 'New or unproven'
  };
}

/**
 * Get Rep-based privileges for a given Rep score
 */
export function getRepPrivileges(rep: number): RepPrivileges {
  return {
    // Auto-approval at 8V (80+)
    canAutoApprove: rep >= 80,
    // Instant pay at 9X (90+)
    canInstantPay: rep >= 90,
    // Pay multiplier increases at Meritous tier (50+)
    payMultiplier: rep >= 90 ? 1.50 :
                   rep >= 80 ? 1.30 :
                   rep >= 70 ? 1.20 :
                   rep >= 60 ? 1.15 :
                   rep >= 50 ? 1.10 :
                   1.00,
    // Manual approval required below Active tier (20)
    requiresManualApproval: rep < 20
  };
}

/**
 * Calculate completion rate percentage
 */
export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Get Rep progress to next milestone (next tier threshold)
 */
export function getRepProgress(rep: number): { current: number; next: number; percentage: number } {
  const milestones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99];
  
  // Find next milestone
  const nextMilestone = milestones.find(m => m > rep) || 99;
  const prevMilestone = milestones.reverse().find(m => m <= rep) || 0;
  
  const progress = rep - prevMilestone;
  const range = nextMilestone - prevMilestone;
  const percentage = range > 0 ? Math.round((progress / range) * 100) : 100;
  
  return {
    current: rep,
    next: nextMilestone,
    percentage
  };
}

/**
 * Format Rep change for display
 */
export function formatRepChange(change: number): { text: string; color: string; emoji: string } {
  if (change > 0) {
    return {
      text: `+${change}`,
      color: '#4CAF50',
      emoji: '📈'
    };
  } else if (change < 0) {
    return {
      text: `${change}`,
      color: '#F44336',
      emoji: '📉'
    };
  } else {
    return {
      text: '±0',
      color: '#9E9E9E',
      emoji: '➡️'
    };
  }
}

/**
 * Get Rep tier color for UI
 */
export function getRepColor(rep: number): string {
  const tier = getRepTier(rep);
  return tier.color;
}

/**
 * Check if Rep qualifies for specific privilege
 */
export function hasRepPrivilege(rep: number, privilege: 'auto_approve' | 'instant_pay' | 'pay_bonus'): boolean {
  const privileges = getRepPrivileges(rep);
  
  switch (privilege) {
    case 'auto_approve':
      return privileges.canAutoApprove;
    case 'instant_pay':
      return privileges.canInstantPay;
    case 'pay_bonus':
      return privileges.payMultiplier > 1.0;
    default:
      return false;
  }
}

/**
 * Calculate estimated Rep change for a given action
 */
export function estimateRepChange(
  action: 'complete_high_quality' | 'complete_medium_quality' | 'complete_low_quality' | 'fail' | 'cancel',
  currentStats: { total: number; completed: number; failed: number; avgQuality: number }
): number {
  // This is a simplified estimation - actual calculation happens in database
  switch (action) {
    case 'complete_high_quality':
      return currentStats.total < 10 ? 3 : currentStats.total < 50 ? 2 : 1;
    case 'complete_medium_quality':
      return currentStats.total < 10 ? 2 : currentStats.total < 50 ? 1 : 0;
    case 'complete_low_quality':
      return currentStats.total < 10 ? 1 : 0;
    case 'fail':
      return currentStats.failed === 0 ? -2 : currentStats.failed < 3 ? -5 : -10;
    case 'cancel':
      return currentStats.failed === 0 ? -1 : currentStats.failed < 3 ? -3 : -5;
    default:
      return 0;
  }
}
