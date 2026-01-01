import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { Text, Button, SegmentedButtons, FAB } from "react-native-paper";
import ParentApprovalQueue from "@/components/ParentApprovalQueue";
import { TaskMallAdmin } from "@/components/TaskMallAdmin";
import SubmissionReviewModal from "@/components/SubmissionReviewModal";
import FinancialSummary from "@/components/FinancialSummary";
import { SupabaseService } from '../../lib/supabase-service';

export default function ParentScreen() {
  const [activeTab, setActiveTab] = useState<'approvals' | 'tasks' | 'financial'>('approvals');
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [parentProfile, setParentProfile] = useState<any>(null);

  useEffect(() => {
    fetchParentProfile();
    if (activeTab === 'approvals') {
      fetchPendingSubmissions();
    }
  }, [activeTab]);

  const fetchParentProfile = async () => {
    try {
      const profile = await SupabaseService.getUserByName('Lauren');
      setParentProfile(profile);
      console.log('[PARENT] Parent profile loaded:', profile?.name);
    } catch (error) {
      console.error('Error fetching parent profile:', error);
    }
  };

  const fetchPendingSubmissions = async () => {
    setLoading(true);
    try {
      console.log('[PARENT] Fetching pending submissions...');
      const submissions = await SupabaseService.getPendingSubmissions();
      console.log('[PARENT] Found submissions:', submissions.length);
      setPendingSubmissions(submissions);
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = (submission: any) => {
    console.log('[PARENT] Opening review for submission:', submission.id);
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    console.log('[PARENT] Review completed, refreshing list');
    fetchPendingSubmissions();
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
          onValueChange={(value) => setActiveTab(value as 'approvals' | 'tasks' | 'financial')}
          buttons={[
            {
              value: 'approvals',
              label: 'Approvals',
              icon: 'check-circle-outline'
            },
            {
              value: 'tasks',
              label: 'Tasks',
              icon: 'format-list-bulleted'
            },
            {
              value: 'financial',
              label: 'Financial',
              icon: 'currency-usd'
            }
          ]}
        />
      </View>

      {/* Content */}
      {activeTab === 'approvals' ? (
        <>
          <ParentApprovalQueue
            pendingSubmissions={pendingSubmissions}
            loading={loading}
            onReview={handleReviewSubmission}
            onRefresh={fetchPendingSubmissions}
          />
          
          {selectedSubmission && parentProfile && (
            <SubmissionReviewModal
              visible={showReviewModal}
              onDismiss={() => setShowReviewModal(false)}
              submission={selectedSubmission}
              reviewerId={parentProfile.id}
              onSuccess={handleReviewSuccess}
            />
          )}
        </>
      ) : activeTab === 'tasks' ? (
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
      ) : (
        <FinancialSummary />
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
