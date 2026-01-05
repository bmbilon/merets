import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text, Button, SegmentedButtons, FAB, Surface, Badge } from "react-native-paper";
import { IconSymbol } from "@/components/ui/icon-symbol";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ParentApprovalQueue from "@/components/ParentApprovalQueue";
import CommitmentApprovalQueue from "@/components/CommitmentApprovalQueue";
import { TaskMallAdmin } from "@/components/TaskMallAdmin";
import SubmissionReviewModal from "@/components/SubmissionReviewModal";
import EnhancedFinancialSummary from "@/components/EnhancedFinancialSummary";
import { SupabaseService } from "../../lib/supabase-service";

export default function ParentScreen() {
  const [activeTab, setActiveTab] = useState<"approvals" | "tasks" | "financial">("approvals");

  // Queue A: commitment approvals (pre-work)
  const [pendingCommitmentApprovals, setPendingCommitmentApprovals] = useState<any[]>([]);

  // Queue B: submission reviews (post-work)
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);

  const [showTaskManager, setShowTaskManager] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [parentProfile, setParentProfile] = useState<any>(null);

  // Collapsible section states
  const [commitmentSectionExpanded, setCommitmentSectionExpanded] = useState(true);
  const [submissionSectionExpanded, setSubmissionSectionExpanded] = useState(true);

  const fetchParentProfile = useCallback(async () => {
    try {
      const selectedUser = await AsyncStorage.getItem("selected_user");
      if (!selectedUser) {
        console.error("[PARENT] No user selected");
        return null;
      }

      const userName = selectedUser.charAt(0).toUpperCase() + selectedUser.slice(1);
      const profile = await SupabaseService.getUserByName(userName);

      setParentProfile(profile);
      console.log("[PARENT] Parent profile loaded:", profile?.name, "ID:", profile?.id);
      return profile;
    } catch (error) {
      console.error("Error fetching parent profile:", error);
      return null;
    }
  }, []);

  const fetchPendingCommitmentApprovals = useCallback(
    async (parentId: string) => {
      try {
        console.log("[PARENT] Fetching pending COMMITMENT approvals...");
        const commitments = await SupabaseService.getPendingCommitmentApprovals(parentId);
        console.log("[PARENT] Found commitments needing approval:", commitments?.length ?? 0);
        setPendingCommitmentApprovals(commitments || []);
      } catch (error) {
        console.error("Error fetching pending commitment approvals:", error);
        setPendingCommitmentApprovals([]);
      }
    },
    []
  );

  const fetchPendingSubmissions = useCallback(async () => {
    try {
      console.log("[PARENT] Fetching pending SUBMISSION reviews...");
      const submissions = await SupabaseService.getPendingSubmissions();
      console.log("[PARENT] Found submissions:", submissions?.length ?? 0);
      setPendingSubmissions(submissions || []);
    } catch (error) {
      console.error("Error fetching pending submissions:", error);
      setPendingSubmissions([]);
    }
  }, []);

  const refreshApprovals = useCallback(async () => {
    setLoading(true);
    try {
      // Ensure we have parent profile FIRST
      const profile = parentProfile?.id ? parentProfile : await fetchParentProfile();
      if (!profile?.id) return;

      // Load both queues
      await Promise.all([
        fetchPendingCommitmentApprovals(profile.id),
        fetchPendingSubmissions()
      ]);
    } finally {
      setLoading(false);
    }
  }, [parentProfile, fetchParentProfile, fetchPendingCommitmentApprovals, fetchPendingSubmissions]);

  useEffect(() => {
    // Always try to load profile when screen mounts/tab changes
    // Only load approvals when in approvals tab
    if (activeTab === "approvals") {
      refreshApprovals();
    } else {
      fetchParentProfile();
    }
  }, [activeTab, refreshApprovals, fetchParentProfile]);

  const handleReviewSubmission = (submission: any) => {
    console.log("[PARENT] Opening review for submission:", submission.id);
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    console.log("[PARENT] Review completed, refreshing list");
    refreshApprovals();
  };

  if (showTaskManager) {
    return <TaskMallAdmin onClose={() => setShowTaskManager(false)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: 60,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#e0e0e0"
        }}
      >
        <Text variant="headlineMedium" style={{ fontWeight: "bold", marginBottom: 16 }}>
          Parent Dashboard
        </Text>

        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          buttons={[
            { value: "approvals", label: "Approvals", icon: "check-circle-outline" },
            { value: "tasks", label: "Tasks", icon: "format-list-bulleted" },
            { value: "financial", label: "Financial", icon: "currency-usd" }
          ]}
        />
      </View>

      {/* Content */}
      {activeTab === "approvals" ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {/* Queue A: Commitment Approvals (pre-work parental approval) */}
          <Surface style={{ borderRadius: 16, marginBottom: 16 }} elevation={1}>
            <View style={{ overflow: "hidden", borderRadius: 16 }}>
            <TouchableOpacity
              onPress={() => setCommitmentSectionExpanded(!commitmentSectionExpanded)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                backgroundColor: "#fff"
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <IconSymbol size={24} name="clock.badge.checkmark" color="#2196F3" />
                <View>
                  <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                    Task Commitments
                  </Text>
                  <Text variant="bodySmall" style={{ color: "#666" }}>
                    Pre-work approval required
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {pendingCommitmentApprovals.length > 0 && (
                  <Badge style={{ backgroundColor: "#2196F3" }}>
                    {pendingCommitmentApprovals.length}
                  </Badge>
                )}
                <IconSymbol
                  size={20}
                  name={commitmentSectionExpanded ? "chevron.up" : "chevron.down"}
                  color="#666"
                />
              </View>
            </TouchableOpacity>

            {commitmentSectionExpanded && (
              <View style={{ borderTopWidth: 1, borderTopColor: "#e0e0e0" }}>
                <CommitmentApprovalQueue
                  loading={loading}
                  items={pendingCommitmentApprovals}
                  onRefresh={refreshApprovals}
                  parentId={parentProfile?.id}
                />
              </View>
            )}
            </View>
          </Surface>

          {/* Queue B: Submission Reviews (post-work quality review) */}
          <Surface style={{ borderRadius: 16, marginBottom: 16 }} elevation={1}>
            <View style={{ overflow: "hidden", borderRadius: 16 }}>
            <TouchableOpacity
              onPress={() => setSubmissionSectionExpanded(!submissionSectionExpanded)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                backgroundColor: "#fff"
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <IconSymbol size={24} name="star.circle" color="#FF9800" />
                <View>
                  <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                    Work Submissions
                  </Text>
                  <Text variant="bodySmall" style={{ color: "#666" }}>
                    Completed work ready for review
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {pendingSubmissions.length > 0 && (
                  <Badge style={{ backgroundColor: "#FF9800" }}>
                    {pendingSubmissions.length}
                  </Badge>
                )}
                <IconSymbol
                  size={20}
                  name={submissionSectionExpanded ? "chevron.up" : "chevron.down"}
                  color="#666"
                />
              </View>
            </TouchableOpacity>

            {submissionSectionExpanded && (
              <View style={{ borderTopWidth: 1, borderTopColor: "#e0e0e0" }}>
                <ParentApprovalQueue
                  pendingSubmissions={pendingSubmissions}
                  loading={loading}
                  onReview={handleReviewSubmission}
                  onRefresh={refreshApprovals}
                />
              </View>
            )}
            </View>
          </Surface>

          {selectedSubmission && parentProfile && (
            <SubmissionReviewModal
              visible={showReviewModal}
              onDismiss={() => setShowReviewModal(false)}
              submission={selectedSubmission}
              reviewerId={parentProfile.id}
              onSuccess={handleReviewSuccess}
            />
          )}
        </ScrollView>
      ) : activeTab === "tasks" ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              marginBottom: 16
            }}
          >
            <Text variant="titleLarge" style={{ fontWeight: "bold", marginBottom: 8 }}>
              Task Manager
            </Text>
            <Text variant="bodyMedium" style={{ color: "#666", textAlign: "center", marginBottom: 16 }}>
              Create, edit, and manage household tasks for your kids
            </Text>
            <Button mode="contained" onPress={() => setShowTaskManager(true)} icon="plus" style={{ borderRadius: 12 }}>
              Open Task Manager
            </Button>
          </View>
        </ScrollView>
      ) : (
        <EnhancedFinancialSummary />
      )}

      {activeTab === "approvals" && (
        <FAB
          icon="plus"
          style={{
            position: "absolute",
            margin: 16,
            right: 0,
            bottom: 0,
            backgroundColor: "#2196F3"
          }}
          onPress={() => setShowTaskManager(true)}
        />
      )}
    </View>
  );
}
