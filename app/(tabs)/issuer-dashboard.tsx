import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { FAB } from "react-native-paper";
import IssuerReviewQueue from "@/components/IssuerReviewQueue";
import CreateMentModal from "@/components/CreateMentModal";
import { SupabaseService } from '../../lib/supabase-service';

export default function IssuerDashboardScreen() {
  const [submittedMents, setSubmittedMents] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadSubmittedMents();
  }, []);

  const loadSubmittedMents = async () => {
    try {
      // TODO: Replace with actual Supabase queries
      // const ments = await SupabaseService.getSubmittedMents();
      // setSubmittedMents(ments);
      
      // Mock data for now
      setSubmittedMents([
        {
          id: '1',
          mentTitle: 'Clean the garage',
          mentDescription: 'Swept floor, organized all tools, took out 3 bags of trash',
          credits: 15,
          earnerName: 'Aveya',
          earnerAge: 15,
          earnerRep: 75,
          submittedDate: '2 hours ago',
          submissionNotes: 'Everything is done! The garage looks great now. I also found some old stuff we can donate.',
          proofPhotos: [],
          dueDate: 'Today'
        }
      ]);
    } catch (error) {
      console.error('Error loading submitted ments:', error);
    }
  };

  const handleReview = async (mentId: string, rating: number, comment: string, tip?: number) => {
    try {
      // TODO: Implement Supabase review logic
      // await SupabaseService.reviewMent(mentId, rating, comment, tip);
      
      // Remove from submitted list
      setSubmittedMents(prev => prev.filter(m => m.id !== mentId));
      console.log('Reviewed ment:', mentId, 'Rating:', rating, 'Tip:', tip);
    } catch (error) {
      console.error('Error reviewing ment:', error);
    }
  };

  const handleRequestRedo = async (mentId: string, comment: string) => {
    try {
      // TODO: Implement Supabase redo request logic
      // await SupabaseService.requestRedo(mentId, comment);
      
      // Remove from submitted list
      setSubmittedMents(prev => prev.filter(m => m.id !== mentId));
      console.log('Requested redo for ment:', mentId);
    } catch (error) {
      console.error('Error requesting redo:', error);
    }
  };

  const handlePublish = async (mentData: any) => {
    try {
      // TODO: Implement Supabase publish logic
      // await SupabaseService.createMent(mentData);
      
      console.log('Published new ment:', mentData);
    } catch (error) {
      console.error('Error publishing ment:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <IssuerReviewQueue
        submittedMents={submittedMents}
        onReview={handleReview}
        onRequestRedo={handleRequestRedo}
      />
      <FAB
        icon="plus"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          backgroundColor: '#6200ee'
        }}
        onPress={() => setShowCreateModal(true)}
      />
      <CreateMentModal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        onPublish={handlePublish}
      />
    </View>
  );
}
