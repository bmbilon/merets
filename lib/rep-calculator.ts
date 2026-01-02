/**
 * Rep Calculation Engine
 * 
 * This module handles the actual calculation and updating of Rep scores
 * based on user actions (task completions, failures, quality ratings, etc.)
 */

import { supabase } from './supabase';
import { 
  calculateCompletionRate, 
  calculateQualityScore, 
  calculateConsistencyBonus, 
  calculateVolumeBonus, 
  calculateFailurePenalty,
  calculateRepScore,
  getRepTier
} from './rep-service';

export interface RepUpdateContext {
  userId: string;
  action: 'complete' | 'fail' | 'cancel' | 'quality_rating';
  commitmentId?: string;
  submissionId?: string;
  qualityRating?: number; // 1-5 stars
  reason?: string;
}

export interface RepCalculationResult {
  oldRep: number;
  newRep: number;
  change: number;
  factors: {
    completionRate: number;
    qualityScore: number;
    consistencyBonus: number;
    volumeBonus: number;
    failurePenalty: number;
  };
  breakdown: {
    completionContribution: number;
    qualityContribution: number;
    consistencyContribution: number;
    volumeContribution: number;
    failurePenalty: number;
  };
}

/**
 * Main function to recalculate and update a user's Rep score
 */
export async function updateUserRep(context: RepUpdateContext): Promise<RepCalculationResult | null> {
  try {
    // 1. Fetch current user profile and stats
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', context.userId)
      .single();
    
    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }
    
    const oldRep = profile.rep_score || 10;
    
    // 2. Calculate all Rep factors based on current data
    const factors = await calculateRepFactors(context.userId);
    
    // 3. Calculate new Rep score
    const calculation = calculateRepScore(factors);
    const newRep = calculation.score;
    const change = newRep - oldRep;
    
    // 4. Get tier information
    const newTierInfo = getRepTier(newRep);
    
    // 5. Update user profile with new Rep
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        rep_score: newRep,
        rep_title: newTierInfo.title,
        rep_tier: newTierInfo.abbrev,
        total_commitments: factors.totalCommitments,
        completed_commitments: factors.completedCommitments,
        failed_commitments: factors.failedCommitments,
        average_quality_rating: factors.avgQualityRating,
        consistency_score: factors.consistencyScore,
        last_rep_update: new Date().toISOString()
      })
      .eq('id', context.userId);
    
    if (updateError) {
      console.error('Error updating user Rep:', updateError);
      return null;
    }
    
    // 6. Record Rep change in history
    await recordRepHistory({
      userId: context.userId,
      oldRep,
      newRep,
      change,
      reason: context.reason || getDefaultReason(context.action),
      commitmentId: context.commitmentId,
      submissionId: context.submissionId
    });
    
    // 7. Return calculation result
    return {
      oldRep,
      newRep,
      change,
      factors: {
        completionRate: factors.completionRate,
        qualityScore: factors.qualityScore,
        consistencyBonus: factors.consistencyBonus,
        volumeBonus: factors.volumeBonus,
        failurePenalty: factors.failurePenalty
      },
      breakdown: calculation.breakdown
    };
    
  } catch (error) {
    console.error('Error in updateUserRep:', error);
    return null;
  }
}

/**
 * Calculate all Rep factors for a user
 */
async function calculateRepFactors(userId: string) {
  // Fetch all commitments for this user
  const { data: commitments, error: commitmentsError } = await supabase
    .from('commitments')
    .select('*')
    .eq('user_id', userId);
  
  if (commitmentsError) {
    console.error('Error fetching commitments:', commitmentsError);
    throw commitmentsError;
  }
  
  const totalCommitments = commitments?.length || 0;
  const completedCommitments = commitments?.filter(c => c.status === 'completed').length || 0;
  const failedCommitments = commitments?.filter(c => c.status === 'failed' || c.status === 'cancelled').length || 0;
  
  // Calculate completion rate (0-100%)
  const completionRatePercent = calculateCompletionRate(completedCommitments, totalCommitments);
  
  // Fetch quality ratings from submissions
  const { data: submissions, error: submissionsError } = await supabase
    .from('commitment_submissions')
    .select('quality_rating')
    .eq('commitment_id', 'in', commitments?.map(c => c.id) || [])
    .not('quality_rating', 'is', null);
  
  const qualityRatings = submissions?.map(s => s.quality_rating).filter(r => r !== null) || [];
  const qualityScorePercent = calculateQualityScore(qualityRatings);
  
  // Calculate average quality rating for profile
  const avgQualityRating = qualityRatings.length > 0 
    ? qualityRatings.reduce((sum, r) => sum + r, 0) / qualityRatings.length 
    : 0;
  
  // Get current streak from profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('current_streak')
    .eq('id', userId)
    .single();
  
  const currentStreak = profile?.current_streak || 0;
  
  // Count tasks completed in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const tasksLast30Days = commitments?.filter(c => 
    c.status === 'completed' && 
    new Date(c.completed_at || c.updated_at) >= thirtyDaysAgo
  ).length || 0;
  
  const consistencyBonusPercent = calculateConsistencyBonus(currentStreak, tasksLast30Days);
  const consistencyScore = consistencyBonusPercent / 100;
  
  // Calculate volume bonus
  const volumeBonusPercent = calculateVolumeBonus(completedCommitments);
  
  // Count failures in last 30 days
  const failuresLast30Days = commitments?.filter(c => 
    (c.status === 'failed' || c.status === 'cancelled') &&
    new Date(c.updated_at) >= thirtyDaysAgo
  ).length || 0;
  
  const failurePenaltyPercent = calculateFailurePenalty(failuresLast30Days);
  
  return {
    totalCommitments,
    completedCommitments,
    failedCommitments,
    avgQualityRating,
    consistencyScore,
    completionRate: completionRatePercent,
    qualityScore: qualityScorePercent,
    consistencyBonus: consistencyBonusPercent,
    volumeBonus: volumeBonusPercent,
    failurePenalty: failurePenaltyPercent
  };
}

/**
 * Record a Rep change in history
 */
async function recordRepHistory(params: {
  userId: string;
  oldRep: number;
  newRep: number;
  change: number;
  reason: string;
  commitmentId?: string;
  submissionId?: string;
}) {
  const { error } = await supabase
    .from('rep_history')
    .insert({
      user_id: params.userId,
      old_rep: params.oldRep,
      new_rep: params.newRep,
      change_amount: params.change,
      change_reason: params.reason,
      related_commitment_id: params.commitmentId,
      related_submission_id: params.submissionId
    });
  
  if (error) {
    console.error('Error recording Rep history:', error);
  }
}

/**
 * Get default reason text for an action
 */
function getDefaultReason(action: string): string {
  switch (action) {
    case 'complete':
      return 'Task completed';
    case 'fail':
      return 'Task failed';
    case 'cancel':
      return 'Task cancelled';
    case 'quality_rating':
      return 'Quality rating received';
    default:
      return 'Rep recalculated';
  }
}

/**
 * Get a user's current Rep score
 */
export async function getUserRepScore(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('rep_score')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    console.error('Error fetching Rep score:', error);
    return 10; // Default starting Rep
  }
  
  return data.rep_score || 10;
}

/**
 * Get a user's Rep history
 */
export async function getUserRepHistory(userId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('rep_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching Rep history:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Estimate Rep change for a potential action (preview before committing)
 */
export async function estimateRepChange(
  userId: string,
  action: 'complete_high' | 'complete_medium' | 'complete_low' | 'fail' | 'cancel'
): Promise<number> {
  try {
    // Get current factors
    const factors = await calculateRepFactors(userId);
    const currentRep = calculateRepScore(factors).score;
    
    // Simulate the action
    let simulatedFactors = { ...factors };
    
    switch (action) {
      case 'complete_high':
        simulatedFactors.completedCommitments += 1;
        simulatedFactors.totalCommitments += 1;
        simulatedFactors.qualityScore = Math.min(100, simulatedFactors.qualityScore + 5);
        break;
      case 'complete_medium':
        simulatedFactors.completedCommitments += 1;
        simulatedFactors.totalCommitments += 1;
        break;
      case 'complete_low':
        simulatedFactors.completedCommitments += 1;
        simulatedFactors.totalCommitments += 1;
        simulatedFactors.qualityScore = Math.max(0, simulatedFactors.qualityScore - 5);
        break;
      case 'fail':
        simulatedFactors.failedCommitments += 1;
        simulatedFactors.totalCommitments += 1;
        simulatedFactors.failurePenalty = Math.min(100, simulatedFactors.failurePenalty + 20);
        break;
      case 'cancel':
        simulatedFactors.failedCommitments += 1;
        simulatedFactors.totalCommitments += 1;
        simulatedFactors.failurePenalty = Math.min(100, simulatedFactors.failurePenalty + 10);
        break;
    }
    
    // Recalculate completion rate
    simulatedFactors.completionRate = calculateCompletionRate(
      simulatedFactors.completedCommitments,
      simulatedFactors.totalCommitments
    );
    
    const simulatedRep = calculateRepScore(simulatedFactors).score;
    return simulatedRep - currentRep;
    
  } catch (error) {
    console.error('Error estimating Rep change:', error);
    return 0;
  }
}
