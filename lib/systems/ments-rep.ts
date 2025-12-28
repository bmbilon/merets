// MentsRep™ - Proprietary Reputation System for Kids
// Combines Reliability, Quality, and Experience into a meaningful, recoverable score

export type QualityRating = 'MISS' | 'PASS' | 'PERFECT';

export interface MentRecord {
  id: string;
  userId: string;
  title: string;
  status: 'SUBMITTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'MISSED';
  quality?: QualityRating;
  acceptedAt?: number; // timestamp when ment was accepted/claimed
  completedAt?: number; // timestamp when ment was completed
  dueDate?: string; // YYYY-MM-DD format
  isDeclined?: boolean; // true if user declined the ment
}

export interface ReputationScores {
  reliability: number; // 0-5 stars
  quality: number; // 0-5 stars  
  experience: number; // 0-5 stars
  mentsRep: number; // 0-5 stars (blended)
}

export interface ReputationStats {
  totalAccepted: number;
  totalCompleted: number;
  totalMissed: number;
  totalDeclined: number;
  qualityDistribution: {
    perfect: number;
    pass: number;
    miss: number;
  };
  currentStreak: number; // consecutive completed ments
  longestStreak: number;
  recentTrend: 'UP' | 'DOWN' | 'STABLE';
}

export interface DetailedReputation extends ReputationScores {
  stats: ReputationStats;
  repLevel: ReputationLevel;
  restrictions: string[];
  benefits: string[];
  nextMilestone: {
    target: number;
    description: string;
    mentsToGo: number;
  } | null;
}

export type ReputationLevel = 
  | 'NOVICE'     // < 2.5
  | 'RELIABLE'   // 2.5 - 3.4
  | 'TRUSTED'    // 3.5 - 4.2  
  | 'EXPERT'     // 4.3 - 4.7
  | 'LEGENDARY'; // 4.8+

// ============================================================================
// CORE CALCULATION FUNCTIONS (Warp-Ready)
// ============================================================================

/**
 * Calculate Reliability Score (0-5 stars)
 * Formula: completedMents / acceptedMents
 * Key: Declined ments do NOT count against reliability
 */
export function calculateReliability(completed: number, accepted: number): number {
  if (accepted === 0) return 5.0; // No data = perfect score
  
  const rate = completed / accepted;

  if (rate >= 0.95) return 5.0;
  if (rate >= 0.90) return 4.5;
  if (rate >= 0.80) return 4.0;
  if (rate >= 0.70) return 3.5;
  if (rate >= 0.60) return 3.0;
  if (rate >= 0.50) return 2.5;
  return 2.0;
}

/**
 * Calculate Quality Score (0-5 stars)
 * Formula: Average of quality ratings (PASS=3, PERFECT=5, MISS=excluded)
 */
export function calculateQuality(qualityRatings: number[]): number {
  if (qualityRatings.length === 0) return 5.0; // No completed work = perfect potential
  
  const avg = qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length;
  return Math.min(5, Math.max(2.5, avg));
}

/**
 * Calculate Experience Score (0-5 stars)  
 * Formula: min(5, log10(completedMents + 1) * 2)
 * Anti-grind: Logarithmic scaling prevents spam farming
 */
export function calculateExperience(completed: number): number {
  return Math.min(5, Math.log10(completed + 1) * 2);
}

/**
 * Calculate Blended MentsRep™ Score (0-5 stars)
 * Weighting: Reliability 50%, Quality 30%, Experience 20%
 * Rounds to one decimal place
 */
export function calculateMentsRep(
  reliability: number,
  quality: number,
  experience: number
): number {
  const rep =
    reliability * 0.5 +
    quality * 0.3 +
    experience * 0.2;

  return Math.round(rep * 10) / 10;
}

// ============================================================================
// COMPREHENSIVE REPUTATION ANALYSIS
// ============================================================================

/**
 * Convert quality rating string to numeric value
 */
function qualityToNumber(quality: QualityRating): number {
  switch (quality) {
    case 'PERFECT': return 5;
    case 'PASS': return 3;
    case 'MISS': return 0; // Will be excluded from quality calc
    default: return 3;
  }
}

/**
 * Calculate time-weighted scores for reputation recovery
 * Recent ments (last 30 days) have 2x weight
 */
function calculateTimeWeightedReliability(ments: MentRecord[]): number {
  if (ments.length === 0) return 5.0;
  
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  
  let totalWeight = 0;
  let completedWeight = 0;
  
  ments.forEach(ment => {
    if (ment.isDeclined || ment.status === 'REJECTED') return;
    
    const weight = (ment.acceptedAt && ment.acceptedAt > thirtyDaysAgo) ? 2.0 : 1.0;
    totalWeight += weight;
    
    if (ment.status === 'COMPLETED') {
      completedWeight += weight;
    }
  });
  
  if (totalWeight === 0) return 5.0;
  return calculateReliability(completedWeight, totalWeight);
}

/**
 * Get reputation level based on MentsRep score
 */
export function getReputationLevel(mentsRep: number): ReputationLevel {
  if (mentsRep >= 4.8) return 'LEGENDARY';
  if (mentsRep >= 4.3) return 'EXPERT';
  if (mentsRep >= 3.5) return 'TRUSTED';
  if (mentsRep >= 2.5) return 'RELIABLE';
  return 'NOVICE';
}

/**
 * Get reputation-based restrictions
 */
export function getReputationRestrictions(mentsRep: number): string[] {
  const restrictions: string[] = [];
  
  if (mentsRep < 3.0) {
    restrictions.push('No premium ments (high-paying tasks)');
  }
  
  if (mentsRep < 2.5) {
    restrictions.push('No autonomous approval (parent must approve all ments)');
    restrictions.push('Limited to basic tasks only');
  }
  
  return restrictions;
}

/**
 * Get reputation-based benefits
 */
export function getReputationBenefits(mentsRep: number): string[] {
  const benefits: string[] = [];
  
  if (mentsRep >= 4.5) {
    benefits.push('Access to high-paying flexible tasks');
    benefits.push('Priority in task assignment');
    benefits.push('Extended deadlines on request');
  }
  
  if (mentsRep >= 4.0) {
    benefits.push('Bonus pay multiplier for streaks');
    benefits.push('Access to advanced skill tasks');
  }
  
  if (mentsRep >= 3.5) {
    benefits.push('Auto-approval for routine tasks');
    benefits.push('Access to premium ment categories');
  }
  
  return benefits;
}

/**
 * Calculate current completion streak
 */
function calculateCurrentStreak(ments: MentRecord[]): number {
  // Sort by completion date (most recent first)
  const completedMents = ments
    .filter(m => m.status === 'COMPLETED' || m.status === 'MISSED')
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  
  let streak = 0;
  for (const ment of completedMents) {
    if (ment.status === 'COMPLETED') {
      streak++;
    } else {
      break; // Streak broken by missed ment
    }
  }
  
  return streak;
}

/**
 * Calculate reputation trend over last 10 ments
 */
function calculateReputationTrend(ments: MentRecord[]): 'UP' | 'DOWN' | 'STABLE' {
  const recent = ments
    .filter(m => m.status === 'COMPLETED' && m.completedAt)
    .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0))
    .slice(-10);
    
  if (recent.length < 5) return 'STABLE';
  
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, m) => sum + qualityToNumber(m.quality || 'PASS'), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, m) => sum + qualityToNumber(m.quality || 'PASS'), 0) / secondHalf.length;
  
  if (secondAvg > firstAvg + 0.5) return 'UP';
  if (secondAvg < firstAvg - 0.5) return 'DOWN';
  return 'STABLE';
}

/**
 * Main function: Calculate comprehensive reputation from ment history
 */
export function calculateComprehensiveReputation(ments: MentRecord[]): DetailedReputation {
  // Filter and categorize ments
  const acceptedMents = ments.filter(m => !m.isDeclined && m.status !== 'REJECTED');
  const completedMents = acceptedMents.filter(m => m.status === 'COMPLETED');
  const missedMents = acceptedMents.filter(m => m.status === 'MISSED');
  const declinedMents = ments.filter(m => m.isDeclined);
  
  // Calculate basic stats
  const totalAccepted = acceptedMents.length;
  const totalCompleted = completedMents.length;
  const totalMissed = missedMents.length;
  const totalDeclined = declinedMents.length;
  
  // Quality distribution
  const qualityRatings = completedMents
    .filter(m => m.quality && m.quality !== 'MISS')
    .map(m => qualityToNumber(m.quality!));
    
  const qualityDistribution = {
    perfect: completedMents.filter(m => m.quality === 'PERFECT').length,
    pass: completedMents.filter(m => m.quality === 'PASS').length,
    miss: completedMents.filter(m => m.quality === 'MISS').length,
  };
  
  // Calculate core scores (with time-weighting for recovery)
  const reliability = calculateTimeWeightedReliability(acceptedMents);
  const quality = calculateQuality(qualityRatings);
  const experience = calculateExperience(totalCompleted);
  const mentsRep = calculateMentsRep(reliability, quality, experience);
  
  // Additional stats
  const currentStreak = calculateCurrentStreak(ments);
  const longestStreak = Math.max(currentStreak, 0); // TODO: Track historically
  const recentTrend = calculateReputationTrend(ments);
  
  // Reputation level and consequences
  const repLevel = getReputationLevel(mentsRep);
  const restrictions = getReputationRestrictions(mentsRep);
  const benefits = getReputationBenefits(mentsRep);
  
  // Next milestone
  let nextMilestone = null;
  if (mentsRep < 4.8) {
    const milestones = [
      { target: 2.5, desc: 'Unlock basic ment categories' },
      { target: 3.5, desc: 'Unlock premium ments & auto-approval' },
      { target: 4.3, desc: 'Unlock expert benefits & bonus pay' },
      { target: 4.8, desc: 'Achieve legendary status' }
    ];
    
    const nextTarget = milestones.find(m => m.target > mentsRep);
    if (nextTarget) {
      // Estimate ments needed (simplified)
      const mentsToGo = Math.max(1, Math.ceil((nextTarget.target - mentsRep) * 10));
      nextMilestone = {
        target: nextTarget.target,
        description: nextTarget.desc,
        mentsToGo
      };
    }
  }
  
  return {
    // Core scores
    reliability,
    quality, 
    experience,
    mentsRep,
    
    // Detailed stats
    stats: {
      totalAccepted,
      totalCompleted,
      totalMissed,
      totalDeclined,
      qualityDistribution,
      currentStreak,
      longestStreak,
      recentTrend
    },
    
    // Level and consequences
    repLevel,
    restrictions,
    benefits,
    nextMilestone
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format reputation score for display
 */
export function formatMentsRep(score: number): string {
  return `⭐ ${score.toFixed(1)}`;
}

/**
 * Get star rating display (filled/empty stars)
 */
export function getStarDisplay(score: number): string {
  const filled = Math.floor(score);
  const half = score - filled >= 0.5 ? 1 : 0;
  const empty = 5 - filled - half;
  
  return '★'.repeat(filled) + (half ? '☆' : '') + '☆'.repeat(empty);
}

/**
 * Get reputation level color
 */
export function getReputationColor(level: ReputationLevel): string {
  switch (level) {
    case 'LEGENDARY': return '#FFD700'; // Gold
    case 'EXPERT': return '#9C27B0'; // Purple  
    case 'TRUSTED': return '#2196F3'; // Blue
    case 'RELIABLE': return '#4CAF50'; // Green
    case 'NOVICE': return '#FF9800'; // Orange
    default: return '#757575'; // Gray
  }
}

/**
 * Get reputation level emoji
 */
export function getReputationEmoji(level: ReputationLevel): string {
  switch (level) {
    case 'LEGENDARY': return '👑';
    case 'EXPERT': return '🏆'; 
    case 'TRUSTED': return '⭐';
    case 'RELIABLE': return '✅';
    case 'NOVICE': return '🌱';
    default: return '❓';
  }
}

// ============================================================================
// MOCK DATA FOR TESTING
// ============================================================================

export const MOCK_MENT_RECORDS: MentRecord[] = [
  // High performer example (Aveya)
  { id: '1', userId: 'aveya', title: 'Clean bathroom', status: 'COMPLETED', quality: 'PERFECT', acceptedAt: Date.now() - 86400000, completedAt: Date.now() - 80000000 },
  { id: '2', userId: 'aveya', title: 'Fold laundry', status: 'COMPLETED', quality: 'PERFECT', acceptedAt: Date.now() - 172800000, completedAt: Date.now() - 170000000 },
  { id: '3', userId: 'aveya', title: 'Load dishwasher', status: 'COMPLETED', quality: 'PASS', acceptedAt: Date.now() - 259200000, completedAt: Date.now() - 250000000 },
  { id: '4', userId: 'aveya', title: 'Vacuum living room', status: 'COMPLETED', quality: 'PERFECT', acceptedAt: Date.now() - 345600000, completedAt: Date.now() - 340000000 },
  { id: '5', userId: 'aveya', title: 'Take out trash', status: 'COMPLETED', quality: 'PASS', acceptedAt: Date.now() - 432000000, completedAt: Date.now() - 430000000 },
  
  // Learning performer example (Onyx)
  { id: '6', userId: 'onyx', title: 'Make bed', status: 'COMPLETED', quality: 'PASS', acceptedAt: Date.now() - 86400000, completedAt: Date.now() - 80000000 },
  { id: '7', userId: 'onyx', title: 'Water plants', status: 'MISSED', acceptedAt: Date.now() - 172800000 },
  { id: '8', userId: 'onyx', title: 'Feed pets', status: 'COMPLETED', quality: 'PASS', acceptedAt: Date.now() - 259200000, completedAt: Date.now() - 250000000 },
  { id: '9', userId: 'onyx', title: 'Organize toys', isDeclined: true, status: 'REJECTED' }, // Declined - doesn't hurt reliability
];