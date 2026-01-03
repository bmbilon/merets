import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EarnerDashboard from "@/components/EarnerDashboard";
import { SupabaseService } from '../../lib/supabase-service';
import { supabase } from '@/lib/supabase';

export default function MyTasks() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [rep, setRep] = useState(0);
  const [totalMerets, setTotalMerets] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [activeMents, setActiveMents] = useState(0);
  const [completedMents, setCompletedMents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await AsyncStorage.getItem("selected_user");
      setSelectedUser(user);
      if (user) {
        loadUserStats(user);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setLoading(false);
    }
  };

  const loadUserStats = async (userName: string) => {
    try {
      setLoading(true);
      
      // Capitalize first letter for database lookup
      const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);
      
      // Get user profile by name
      const userProfile = await SupabaseService.getUserByName(capitalizedName);
      
      if (userProfile) {
        // Store user profile
        setUserProfile(userProfile);
        
        // Set rep and total earnings
        setRep(userProfile.rep_score || 10);
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
        
        // Get lifetime merets from profile
        setTotalMerets(userProfile.lifetime_merets || 0);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !selectedUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Get user display info
  const userName = selectedUser.charAt(0).toUpperCase() + selectedUser.slice(1);
  const userColor = selectedUser === 'aveya' ? '#E91E63' : '#2196F3';

  return (
    <EarnerDashboard
      userName={userName}
      userColor={userColor}
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
