import React, { useState, useEffect } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Provider as PaperProvider,
  Text,
  IconButton,
} from "react-native-paper";
import EarnerTaskMarket from "@/components/EarnerTaskMarket";
import MentDetailModal from "@/components/MentDetailModal";
import EnhancedCelebration from "@/components/EnhancedCelebration";
import RepChangeToast from "@/components/RepChangeToast";
import { supabase } from "@/lib/supabase";
import { SupabaseService } from "@/lib/supabase-service";

export default function MainApp() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await AsyncStorage.getItem("selected_user");
        console.log('[Index] Loaded user:', user);
        setSelectedUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <PaperProvider>
        <View style={{ padding: 16, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading…</Text>
        </View>
      </PaperProvider>
    );
  }

  // If no user, AuthGate will handle showing user selection
  // This shouldn't happen as AuthGate wraps everything
  if (!selectedUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No user selected</Text>
      </View>
    );
  }

  // Route to appropriate dashboard based on selected user
  const handleSwitchUser = async () => {
    console.log('[Index] Switch user pressed - clearing AsyncStorage');
    await AsyncStorage.removeItem("selected_user");
    // AuthGate will detect the change and show user selection
  };

  switch (selectedUser) {
    case "aveya":
      return <EarnerMarketplace userName="Aveya" userColor="#E91E63" onSwitchUser={handleSwitchUser} />;
    
    case "onyx":
      return <EarnerMarketplace userName="Onyx" userColor="#2196F3" onSwitchUser={handleSwitchUser} />;
    
    case "lauren":
    case "brett":
      return <ParentDashboard onSwitchUser={handleSwitchUser} selectedUser={selectedUser} />;
    
    default:
      // Reset if unknown user
      setSelectedUser(null);
      return null;
  }
}

// Earner Marketplace Component
function EarnerMarketplace({ userName, userColor, onSwitchUser }: { userName: string; userColor: string; onSwitchUser: () => void }) {
  const [selectedMent, setSelectedMent] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [ments, setMents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userStats, setUserStats] = useState({ totalEarnings: 0, currentStreak: 0, totalXP: 0, level: 1, lifetimeMeters: 0, experienceHours: 0 });
  const [userId, setUserId] = useState<string | null>(null);
  const [repScore, setRepScore] = useState(10);

  // Fetch user profile and stats
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, total_earnings_cents, total_xp, rep_score, lifetime_merets, experience_hours')
          .eq('name', userName)
          .single();
        
        if (profile) {
          setUserId(profile.id);
          
          // Set Rep score from profile
          setRepScore(profile.rep_score || 10);
          
          // Calculate level from XP (100 XP per level)
          const level = Math.floor(profile.total_xp / 100) + 1;
          
          // Get current streak (count consecutive days with completed tasks)
          const { data: recentCompletions } = await supabase
            .from('commitments')
            .select('completed_at')
            .eq('user_id', profile.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(30);
          
          let streak = 0;
          if (recentCompletions && recentCompletions.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let checkDate = new Date(today);
            
            for (let i = 0; i < 30; i++) {
              const hasCompletion = recentCompletions.some(c => {
                const completedDate = new Date(c.completed_at);
                completedDate.setHours(0, 0, 0, 0);
                return completedDate.getTime() === checkDate.getTime();
              });
              
              if (hasCompletion) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
              } else if (i === 0) {
                // Check yesterday for ongoing streak
                checkDate.setDate(checkDate.getDate() - 1);
                const hasYesterday = recentCompletions.some(c => {
                  const completedDate = new Date(c.completed_at);
                  completedDate.setHours(0, 0, 0, 0);
                  return completedDate.getTime() === checkDate.getTime();
                });
                if (hasYesterday) {
                  streak++;
                  checkDate.setDate(checkDate.getDate() - 1);
                } else {
                  break;
                }
              } else {
                break;
              }
            }
          }
          
          setUserStats({
            totalEarnings: profile.total_earnings_cents / 100,
            currentStreak: streak,
            totalXP: profile.total_xp,
            level,
            lifetimeMeters: profile.lifetime_merets || 0,
            experienceHours: profile.experience_hours || 0
          });
        }
      } catch (error) {
        console.error('[STATS] Error fetching user stats:', error);
      }
    };
    
    fetchUserProfile();
  }, [userName]);

  // Fetch tasks from Supabase
  useEffect(() => {
    console.log('[MOUNT] EarnerMarketplace mounted for:', userName);
    fetchMents();
  }, []);

  const fetchMents = async () => {
    try {
      console.log('[FETCH] Starting to fetch ments from Supabase...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('skill_category', { ascending: true });

      console.log('[FETCH] Supabase response:', { 
        dataCount: data?.length, 
        hasError: !!error,
        errorDetails: error 
      });

      if (error) {
        console.error('[ERROR] Error fetching ments:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('[WARN] No tasks found in database');
        setMents([]);
        return;
      }

      // Transform Supabase data to match component format
      const transformedMents = data.map(task => {
        // Determine status based on task properties
        let status: 'available' | 'quick' | 'recommended' = 'available';
        if (task.is_micro_task && task.effort_minutes <= 5) {
          status = 'quick';
        }
        // Could add logic for 'recommended' based on user preferences later
        
        return {
          id: task.id,
          title: task.title,
          description: task.description || '',
          category: task.skill_category,
          credits: task.base_pay_cents / 100, // Convert cents to dollars
          timeEstimate: `${task.effort_minutes} min`,
          dueDate: 'Available now',
          difficulty: task.difficulty_level === 1 ? 'easy' : task.difficulty_level === 2 ? 'medium' : 'hard',
          approvalRequired: false,
          issuerName: 'Family',
          issuerTrust: 'Family',
          issuerRep: 100,
          status: status
        };
      });

      console.log('[SUCCESS] Transformed', transformedMents.length, 'ments');
      console.log('[SUCCESS] First ment:', transformedMents[0]);
      setMents(transformedMents);
    } catch (error) {
      console.error('[EXCEPTION] Error in fetchMents:', error);
    } finally {
      setLoading(false);
      console.log('[FETCH] Fetch complete, loading set to false');
    }
  };

  const handleCommit = async (mentId: string) => {
    try {
      // Get user profile to get user ID
      const userProfile = await SupabaseService.getUserByName(userName);
      if (!userProfile) {
        console.error('User profile not found');
        return;
      }

      // Find the selected task
      const selectedTask = ments.find(m => m.id === mentId);
      if (!selectedTask) {
        console.error('Task not found');
        return;
      }

      // Create commitment in database
      const commitment = await SupabaseService.createCommitment({
        user_id: userProfile.id,
        task_template_id: mentId,
        skill_category: selectedTask.category,
        effort_minutes: parseInt(selectedTask.timeEstimate) || 30,
        pay_cents: Math.round(selectedTask.credits * 100),
        status: 'pending_approval'  // Requires parent approval before starting
      });

      console.log('Commitment created:', commitment.id);
      setShowDetail(false);
      
      // Calculate XP reward (10 XP per task)
      const earnedXP = 10;
      const newTotalXP = userStats.totalXP + earnedXP;
      const oldLevel = userStats.level;
      const newLevel = Math.floor(newTotalXP / 100) + 1;
      const leveledUp = newLevel > oldLevel;
      
      // Update user stats in database
      if (userId) {
        await supabase
          .from('user_profiles')
          .update({ total_xp: newTotalXP })
          .eq('id', userId);
        
        // Update local state
        setUserStats(prev => ({
          ...prev,
          totalXP: newTotalXP,
          level: newLevel
        }));
      }
      
      // Show confetti celebration
      setShowCelebration(true);
      
      // Refresh the ments list
      await fetchMents();
    } catch (error) {
      console.error('Error creating commitment:', error);
    }
  };

  console.log('[RENDER] EarnerMarketplace render - loading:', loading, 'ments count:', ments.length);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading ments...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: 50, right: 16, zIndex: 1000 }}>
        <IconButton 
          icon="account-switch" 
          onPress={onSwitchUser}
          style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        />
      </View>
      <EarnerTaskMarket 
        userName={userName}
        tasks={ments}
        activeTasks={[]}
        totalEarnings={userStats.totalEarnings}
        currentStreak={userStats.currentStreak}
        level={userStats.level}
        totalXP={userStats.totalXP}
        repScore={repScore}
        lifetimeMeters={userStats.lifetimeMeters}
        experienceHours={userStats.experienceHours}
        onTaskPress={(task) => {
          setSelectedMent(task);
          setShowDetail(true);
        }}
        onRefresh={fetchMents}
      />
      <MentDetailModal
        visible={showDetail}
        onDismiss={() => setShowDetail(false)}
        ment={selectedMent}
        onCommit={handleCommit}
      />
      <EnhancedCelebration
        visible={showCelebration}
        onComplete={() => {
          setShowCelebration(false);
          fetchMents(); // Refresh task list
        }}
      />
      {userId && <RepChangeToast userId={userId} />}
    </View>
  );
}

// Parent Dashboard Component (using the existing parent screen logic)
function ParentDashboard({ onSwitchUser, selectedUser }: { onSwitchUser: () => void; selectedUser: string }) {
  // Import and use the existing parent screen
  const ParentScreen = require('./parent').default;
  
  // Create a wrapper that includes the switch user functionality
  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: 50, right: 16, zIndex: 1000 }}>
        <IconButton 
          icon="account-switch" 
          onPress={onSwitchUser}
          style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        />
      </View>
      <ParentScreen />
    </View>
  );
}
