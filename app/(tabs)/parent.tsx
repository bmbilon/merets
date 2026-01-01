import React, { useState, useEffect } from "react";
import { View } from "react-native";
import ParentApprovalQueue from "@/components/ParentApprovalQueue";
import { SupabaseService } from '../../lib/supabase-service';

export default function ParentScreen() {
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      // TODO: Replace with actual Supabase queries
      // const approvals = await SupabaseService.getPendingApprovals();
      // setPendingApprovals(approvals);
      
      // Mock data for now
      setPendingApprovals([
        {
          id: '1',
          mentTitle: 'Clean the garage',
          mentDescription: 'Sweep floor, organize tools on pegboard, take out trash and recycling',
          credits: 15,
          timeEstimate: '1 hour',
          dueDate: 'Tomorrow',
          earnerName: 'Aveya',
          earnerAge: 15,
          issuerName: 'Dad',
          issuerTrust: 'Family',
          category: 'Chores',
          safetyNotes: 'Use gloves when handling sharp tools'
        },
        {
          id: '2',
          mentTitle: 'Walk the dog',
          mentDescription: '30 minute walk around the neighborhood, bring water and waste bags',
          credits: 8,
          timeEstimate: '30 min',
          dueDate: 'Today',
          earnerName: 'Onyx',
          earnerAge: 11,
          issuerName: 'Mom',
          issuerTrust: 'Family',
          category: 'Pet Care'
        }
      ]);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      // TODO: Implement Supabase approval logic
      // await SupabaseService.approveMent(id);
      
      // Remove from pending list
      setPendingApprovals(prev => prev.filter(a => a.id !== id));
      console.log('Approved ment:', id);
    } catch (error) {
      console.error('Error approving ment:', error);
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      // TODO: Implement Supabase rejection logic
      // await SupabaseService.rejectMent(id, reason);
      
      // Remove from pending list
      setPendingApprovals(prev => prev.filter(a => a.id !== id));
      console.log('Rejected ment:', id, 'Reason:', reason);
    } catch (error) {
      console.error('Error rejecting ment:', error);
    }
  };

  return (
    <ParentApprovalQueue
      pendingApprovals={pendingApprovals}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
