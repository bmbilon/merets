import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import EarnerDashboard from "@/components/EarnerDashboard";
import { SupabaseService } from '../../lib/supabase-service';
import { supabase } from '@/lib/supabase';

interface AveyaDashboardProps {
  onSwitchUser: () => void;
}

export default function AveyaDashboard({ onSwitchUser }: AveyaDashboardProps) {
  const [rep, setRep] = useState(0);
  const [totalMerets, setTotalMerets] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [activeMents, setActiveMents] = useState(0);
  const [completedMents, setCompletedMents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      
      // Get user profile by name
      const userProfile = await SupabaseService.getUserByName('Aveya');
      
      if (userProfile) {
        // Store user profile
        setUserProfile(userProfile);
        
        // Set rep and total earnings
        setRep(userProfile.total_xp || 0);
        setTotalCredits((userProfile.total_earnings_cents || 0) / 100); // Convert cents to dollars
        
        // Get active commitments count
        const activeCommitments = await SupabaseService.getUserCommitments(
          userProfile.id,
          'in_progress'
        );
        setActiveMents(activeCommitments.length);
        
        // Get completed commitments count
        const { data: completedData, error: completedError } = await supabase
          .from('commitments')
          .select('id', { count: 'exact' })
          .eq('user_id', userProfile.id)
          .eq('status', 'completed');
        
        if (!completedError && completedData) {
          setCompletedMents(completedData.length);
        }
        
        // Calculate total merets (could be based on a formula)
        // For now, using XP as merets
        setTotalMerets(userProfile.total_xp || 0);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <EarnerDashboard
      userName="Aveya"
      userColor="#E91E63"
      rep={rep}
      totalMerets={totalMerets}
      totalCredits={totalCredits}
      activeMents={activeMents}
      completedMents={completedMents}
      userId={userProfile?.id}
      currentStreak={userProfile?.current_streak || 0}
      longestStreak={userProfile?.longest_streak || 0}
    />
  );
}
