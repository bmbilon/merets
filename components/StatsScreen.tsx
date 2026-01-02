import React, { useEffect, useState } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { Surface, Text, ProgressBar, Chip } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface StatsScreenProps {
  userId: string;
  userName: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  requirement: number;
  rarity: string;
}

export default function StatsScreen({ userId, userName }: StatsScreenProps) {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    averageRating: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    level: 1,
    repScore: 10
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAchievements();
  }, [userId]);

  const fetchStats = async () => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_earnings_cents, total_xp, rep_score')
        .eq('id', userId)
        .single();

      // Get commitment stats
      const { data: commitments } = await supabase
        .from('commitments')
        .select('status, quality_rating, completed_at')
        .eq('user_id', userId);

      const completed = commitments?.filter(c => c.status === 'completed') || [];
      const inProgress = commitments?.filter(c => c.status === 'in_progress') || [];
      
      // Calculate average rating
      const ratings = completed.filter(c => c.quality_rating).map(c => c.quality_rating);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;

      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      if (completed.length > 0) {
        const sortedDates = completed
          .map(c => new Date(c.completed_at))
          .sort((a, b) => b.getTime() - a.getTime());
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let checkDate = new Date(today);
        
        // Calculate current streak
        for (let i = 0; i < 30; i++) {
          const hasCompletion = sortedDates.some(d => {
            const completedDate = new Date(d);
            completedDate.setHours(0, 0, 0, 0);
            return completedDate.getTime() === checkDate.getTime();
          });
          
          if (hasCompletion) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (i === 0) {
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        
        // Calculate longest streak
        const uniqueDates = Array.from(new Set(sortedDates.map(d => {
          const date = new Date(d);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        }))).sort((a, b) => b - a);
        
        for (let i = 0; i < uniqueDates.length; i++) {
          if (i === 0 || uniqueDates[i - 1] - uniqueDates[i] === 86400000) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 1;
          }
        }
      }

      const level = Math.floor((profile?.total_xp || 0) / 100) + 1;

      setStats({
        totalEarnings: (profile?.total_earnings_cents || 0) / 100,
        totalTasks: commitments?.length || 0,
        completedTasks: completed.length,
        inProgressTasks: inProgress.length,
        averageRating: avgRating,
        currentStreak,
        longestStreak,
        totalXP: profile?.total_xp || 0,
        level,
        repScore: profile?.rep_score || 10
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      // Get all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('rarity', { ascending: true });

      // Get user's unlocked achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, progress')
        .eq('user_id', userId);

      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      
      const achievementsList: Achievement[] = (allAchievements || []).map(ach => ({
        id: ach.id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        unlocked: unlockedIds.has(ach.id),
        progress: userAchievements?.find(ua => ua.achievement_id === ach.id)?.progress || 0,
        requirement: ach.requirement_value,
        rarity: ach.rarity
      }));

      setAchievements(achievementsList);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9E9E9E';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <LinearGradient
        colors={['#6200ee', '#3700B3']}
        style={{ padding: 20, paddingTop: 60 }}
      >
        <Text variant="headlineMedium" style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>
          {userName}'s Stats
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
          Level {stats.level} • {stats.totalXP} XP
        </Text>
        <ProgressBar 
          progress={(stats.totalXP % 100) / 100} 
          color="#FFD700" 
          style={{ height: 8, borderRadius: 4, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)' }}
        />
      </LinearGradient>

      {/* Stats Grid */}
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Surface style={{ width: (width - 44) / 2, padding: 16, borderRadius: 12, elevation: 2, marginBottom: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2E7D32' }}>
              ${stats.totalEarnings.toFixed(2)}
            </Text>
            <Text style={{ color: '#666', marginTop: 4 }}>Total Earned</Text>
          </Surface>

          <Surface style={{ width: (width - 44) / 2, padding: 16, borderRadius: 12, elevation: 2, marginBottom: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#6200ee' }}>
              {stats.completedTasks}
            </Text>
            <Text style={{ color: '#666', marginTop: 4 }}>Tasks Done</Text>
          </Surface>

          <Surface style={{ width: (width - 44) / 2, padding: 16, borderRadius: 12, elevation: 2, marginBottom: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#FF6B00' }}>
              {stats.currentStreak} 🔥
            </Text>
            <Text style={{ color: '#666', marginTop: 4 }}>Current Streak</Text>
          </Surface>

          <Surface style={{ width: (width - 44) / 2, padding: 16, borderRadius: 12, elevation: 2, marginBottom: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#FFD700' }}>
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
            </Text>
            <Text style={{ color: '#666', marginTop: 4 }}>Avg Rating ⭐</Text>
          </Surface>

          <Surface style={{ width: (width - 44) / 2, padding: 16, borderRadius: 12, elevation: 2, marginBottom: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#1976D2' }}>
              {stats.inProgressTasks}
            </Text>
            <Text style={{ color: '#666', marginTop: 4 }}>In Progress</Text>
          </Surface>

          <Surface style={{ width: (width - 44) / 2, padding: 16, borderRadius: 12, elevation: 2, marginBottom: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#D32F2F' }}>
              {stats.longestStreak}
            </Text>
            <Text style={{ color: '#666', marginTop: 4 }}>Best Streak</Text>
          </Surface>

          <Surface style={{ width: (width - 44) / 2, padding: 16, borderRadius: 12, elevation: 2, marginBottom: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#9C27B0' }}>
              {stats.repScore}
            </Text>
            <Text style={{ color: '#666', marginTop: 4 }}>Rep Score</Text>
          </Surface>
        </View>

        {/* Achievements Section */}
        <Text variant="titleLarge" style={{ fontWeight: 'bold', marginTop: 24, marginBottom: 12 }}>
          Achievements
        </Text>

        {achievements.map(achievement => (
          <Surface 
            key={achievement.id}
            style={{ 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 12, 
              elevation: achievement.unlocked ? 3 : 1,
              opacity: achievement.unlocked ? 1 : 0.6,
              borderWidth: achievement.unlocked ? 2 : 0,
              borderColor: getRarityColor(achievement.rarity)
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 32, marginRight: 12 }}>
                {achievement.unlocked ? achievement.icon : '🔒'}
              </Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                    {achievement.title}
                  </Text>
                  <Chip 
                    compact 
                    style={{ backgroundColor: getRarityColor(achievement.rarity), height: 24 }}
                    textStyle={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}
                  >
                    {achievement.rarity.toUpperCase()}
                  </Chip>
                </View>
                <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
                  {achievement.description}
                </Text>
              </View>
            </View>
            
            {!achievement.unlocked && achievement.progress > 0 && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#999' }}>
                    Progress: {achievement.progress} / {achievement.requirement}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#999' }}>
                    {Math.round((achievement.progress / achievement.requirement) * 100)}%
                  </Text>
                </View>
                <ProgressBar 
                  progress={achievement.progress / achievement.requirement} 
                  color={getRarityColor(achievement.rarity)}
                  style={{ height: 6, borderRadius: 3 }}
                />
              </View>
            )}
          </Surface>
        ))}
      </View>
    </ScrollView>
  );
}
