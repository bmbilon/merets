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
  const lastLevelUpTime = useRef<number>(0);

  useEffect(() => {
    loadUser();
  }, []);

  // Realtime subscription for rep_score updates
  useEffect(() => {
    if (!userProfile?.id) return;

    console.log('[REALTIME] Setting up rep_score subscription for user:', userProfile.id);
    
    const channel = supabase
      .channel(`user_profiles:${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userProfile.id}`
        },
        (payload) => {
          console.log('[REALTIME] Received rep_score update:', payload);
          const newRep = payload.new.rep_score ?? 10;
          const oldRep = previousLevel.current;
          
          // Update rep display
          setRep(newRep);
          
          // Check for level-up (rep increased)
          if (newRep > oldRep) {
            console.log(`[LEVEL UP] Rep ${oldRep} → ${newRep}`);
            setNewLevel(newRep);
            setShowLevelUp(true);
            lastLevelUpTime.current = Date.now();
            previousLevel.current = newRep;
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[REALTIME] Cleaning up rep_score subscription');
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  // Refresh data when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      if (selectedUser) {
        // Prevent reload immediately after level-up celebration
        const timeSinceLastLevelUp = Date.now() - lastLevelUpTime.current;
        if (timeSinceLastLevelUp > 2000) {
          loadUserStats(selectedUser);
        }
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
        
        // Level equals rep_score 1:1 (rep 29 = level 29, rep 30 = level 30)
        const currentLevel = userProfile.rep_score ?? 10;
        
        // Check for level-up (only if we have a previous level)
        if (previousLevel.current > 0 && currentLevel > previousLevel.current) {
          console.log(`[LEVEL UP] Rep ${previousLevel.current} → ${currentLevel}`);
          setNewLevel(currentLevel);
          setShowLevelUp(true);
          lastLevelUpTime.current = Date.now();
        }
        
        // Initialize previousLevel on first load (don't trigger celebration)
        if (previousLevel.current === 0) {
          previousLevel.current = currentLevel;
        } else {
          previousLevel.current = currentLevel;
        }
        
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
        onDismiss={() => {
          setShowLevelUp(false);
          lastLevelUpTime.current = Date.now();
        }}
      />
    </>
  );
}
