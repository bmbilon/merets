import React, { useState, useEffect, useRef } from "react";
import { View, Text } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import EarnerDashboard from "@/components/EarnerDashboard";
import LevelUpCelebration from "@/components/LevelUpCelebration";
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
  
  // Level-up celebration state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const previousLevel = useRef<number>(0);

  useEffect(() => {
    loadUser();
  }, []);

  // Refresh data when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      if (selectedUser) {
        loadUserStats(selectedUser);
      }
    }, [selectedUser])
  );

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
      const userProfile: any = await SupabaseService.getUserByName(capitalizedName);
      
      if (userProfile) {
        // Store user profile
        setUserProfile(userProfile);
        
        // Calculate level from rep score (1 level per 25 rep)
        const currentLevel = Math.floor((userProfile.rep_score || 10) / 25);
        
        // Check for level-up
        if (previousLevel.current > 0 && currentLevel > previousLevel.current) {
          console.log(`[LEVEL UP] ${previousLevel.current} → ${currentLevel}`);
          setNewLevel(currentLevel);
          setShowLevelUp(true);
        }
        previousLevel.current = currentLevel;
        
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
    <>
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
      
      <LevelUpCelebration
        visible={showLevelUp}
        level={newLevel}
        onDismiss={() => setShowLevelUp(false)}
      />
    </>
  );
}
