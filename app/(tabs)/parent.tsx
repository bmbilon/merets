import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { Text, Button, SegmentedButtons, FAB } from "react-native-paper";
import ParentApprovalQueue from "@/components/ParentApprovalQueue";
import TaskMallAdmin from "@/components/TaskMallAdmin";
import { SupabaseService } from '../../lib/supabase-service';

export default function ParentScreen() {
  const [activeTab, setActiveTab] = useState<'approvals' | 'tasks'>('approvals');
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [showTaskManager, setShowTaskManager] = useState(false);

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

  if (showTaskManager) {
    return (
      <TaskMallAdmin 
        onClose={() => setShowTaskManager(false)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
      }}>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>
          Parent Dashboard
        </Text>
        
        {/* Tab Selector */}
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'approvals' | 'tasks')}
          buttons={[
            {
              value: 'approvals',
              label: 'Approvals',
              icon: 'check-circle-outline'
            },
            {
              value: 'tasks',
              label: 'Task Manager',
              icon: 'format-list-bulleted'
            }
          ]}
        />
      </View>

      {/* Content */}
      {activeTab === 'approvals' ? (
        <ParentApprovalQueue
          pendingApprovals={pendingApprovals}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <View style={{ 
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Task Manager
            </Text>
            <Text variant="bodyMedium" style={{ color: '#666', textAlign: 'center', marginBottom: 16 }}>
              Create, edit, and manage household tasks for your kids
            </Text>
            <Button 
              mode="contained" 
              onPress={() => setShowTaskManager(true)}
              icon="plus"
              style={{ borderRadius: 12 }}
            >
              Open Task Manager
            </Button>
          </View>
        </ScrollView>
      )}

      {/* FAB for quick access to task manager */}
      {activeTab === 'approvals' && (
        <FAB
          icon="plus"
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 0,
            backgroundColor: '#2196F3'
          }}
          onPress={() => setShowTaskManager(true)}
        />
      )}
    </View>
  );
}
