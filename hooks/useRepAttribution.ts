/**
 * useRepAttribution Hook
 * 
 * React hook for interacting with the Rep attribution system.
 * Provides real-time Rep updates, blockchain verification, and audit trail access.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface RepAuditEntry {
  entry_id: string;
  timestamp: string;
  action_type: string;
  old_rep: number;
  new_rep: number;
  change_amount: number;
  reason: string;
  completion_rate: number;
  quality_score: number;
  consistency_score: number;
  volume_bonus: number;
  failure_penalty: number;
  blockchain_hash: string;
  is_verified: boolean;
}

export interface RepBlockchainStatus {
  is_valid: boolean;
  total_entries: number;
  verified_entries: number;
  broken_chain_at_entry: string | null;
  error_message: string | null;
}

export interface RepAttribution {
  repScore: number;
  completionRate: number;
  qualityScore: number;
  consistencyScore: number;
  volumeBonus: number;
  failurePenalty: number;
  totalCommitments: number;
  completedCommitments: number;
  failedCommitments: number;
}

export function useRepAttribution(userId: string | null) {
  const [repData, setRepData] = useState<RepAttribution | null>(null);
  const [auditTrail, setAuditTrail] = useState<RepAuditEntry[]>([]);
  const [blockchainStatus, setBlockchainStatus] = useState<RepBlockchainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current Rep data with full attribution
   */
  const fetchRepData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'calculate_rep_score_with_attribution',
        { p_user_id: userId }
      );

      if (rpcError) throw rpcError;

      if (data && data.length > 0) {
        const result = data[0];
        setRepData({
          repScore: result.rep_score,
          completionRate: parseFloat(result.completion_rate),
          qualityScore: parseFloat(result.quality_score),
          consistencyScore: parseFloat(result.consistency_score),
          volumeBonus: result.volume_bonus,
          failurePenalty: result.failure_penalty,
          totalCommitments: result.total_commitments,
          completedCommitments: result.completed_commitments,
          failedCommitments: result.failed_commitments,
        });
      }
    } catch (err) {
      console.error('Error fetching Rep data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Rep data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Fetch Rep audit trail
   */
  const fetchAuditTrail = useCallback(async (limit: number = 50) => {
    if (!userId) return;

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'get_rep_audit_trail',
        { p_user_id: userId, p_limit: limit }
      );

      if (rpcError) throw rpcError;

      if (data) {
        setAuditTrail(data);
      }
    } catch (err) {
      console.error('Error fetching audit trail:', err);
    }
  }, [userId]);

  /**
   * Verify blockchain integrity
   */
  const verifyBlockchain = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'verify_rep_blockchain',
        { p_user_id: userId }
      );

      if (rpcError) throw rpcError;

      if (data && data.length > 0) {
        const result = data[0];
        setBlockchainStatus({
          is_valid: result.is_valid,
          total_entries: result.total_entries,
          verified_entries: result.verified_entries,
          broken_chain_at_entry: result.broken_chain_at_entry,
          error_message: result.error_message,
        });
      }
    } catch (err) {
      console.error('Error verifying blockchain:', err);
    }
  }, [userId]);

  /**
   * Subscribe to real-time Rep changes
   */
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchRepData();
    fetchAuditTrail();

    // Subscribe to rep_history changes for real-time updates
    const subscription = supabase
      .channel(`rep_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rep_history',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Rep change detected:', payload);
          // Refresh Rep data when new entry is added
          fetchRepData();
          fetchAuditTrail();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, fetchRepData, fetchAuditTrail]);

  /**
   * Manually refresh all Rep data
   */
  const refresh = useCallback(async () => {
    await fetchRepData();
    await fetchAuditTrail();
    await verifyBlockchain();
  }, [fetchRepData, fetchAuditTrail, verifyBlockchain]);

  return {
    repData,
    auditTrail,
    blockchainStatus,
    loading,
    error,
    refresh,
    verifyBlockchain,
    fetchAuditTrail,
  };
}

/**
 * Hook for listening to Rep change notifications
 */
export function useRepChangeNotifications(userId: string | null, onRepChange?: (change: RepAuditEntry) => void) {
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`rep_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rep_history',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (onRepChange && payload.new) {
            onRepChange(payload.new as RepAuditEntry);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, onRepChange]);
}

/**
 * Hook for getting Rep-based privileges
 */
export function useRepPrivileges(repScore: number) {
  const [privileges, setPrivileges] = useState({
    canAutoApprove: false,
    canInstantPay: false,
    payMultiplier: 1.0,
    requiresManualApproval: true,
  });

  useEffect(() => {
    // Calculate privileges based on Rep score
    const canAutoApprove = repScore >= 80;
    const canInstantPay = repScore >= 90;
    
    let payMultiplier = 1.0;
    if (repScore >= 90) payMultiplier = 1.25;
    else if (repScore >= 80) payMultiplier = 1.20;
    else if (repScore >= 70) payMultiplier = 1.15;
    else if (repScore >= 60) payMultiplier = 1.10;
    else if (repScore >= 50) payMultiplier = 1.05;

    setPrivileges({
      canAutoApprove,
      canInstantPay,
      payMultiplier,
      requiresManualApproval: !canAutoApprove,
    });
  }, [repScore]);

  return privileges;
}
