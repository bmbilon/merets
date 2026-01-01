import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Surface, Text, Avatar, Chip } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '../lib/supabase';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

interface LeaderboardEntry {
  id: string;
  name: string;
  total_xp: number;
  total_earnings_cents: number;
  tasks_completed: number;
  current_streak: number;
  avatar_color?: string;
}

interface LeaderboardProps {
  currentUserId?: string;
  compact?: boolean;
}

export default function Leaderboard({ currentUserId, compact = false }: LeaderboardProps) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'alltime'>('week');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // Get all earner users sorted by XP
      const { data, error} = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'kid')
        .order('total_xp', { ascending: false })
        .limit(compact ? 3 : 10);

      if (!error && data) {
        setLeaders(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: 'trophy.fill', color: '#FFD700', label: '🥇' };
      case 2:
        return { icon: 'medal.fill', color: '#C0C0C0', label: '🥈' };
      case 3:
        return { icon: 'medal.fill', color: '#CD7F32', label: '🥉' };
      default:
        return { icon: 'number', color: '#999', label: `#${rank}` };
    }
  };

  const getUserColor = (name: string) => {
    const colors: Record<string, string> = {
      'Aveya': '#E91E63',
      'Onyx': '#2196F3',
      'default': '#9C27B0'
    };
    return colors[name] || colors['default'];
  };

  if (loading) {
    return <LoadingState message="Loading leaderboard..." icon="chart.bar.fill" compact={compact} />;
  }

  if (compact) {
    return (
      <Surface style={{ 
        borderRadius: 16, 
        padding: 16, 
        backgroundColor: '#fff',
        elevation: 2
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconSymbol size={24} name="chart.bar.fill" color="#FF9800" />
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              Top Earners
            </Text>
          </View>
          <Chip compact style={{ backgroundColor: '#FFF3E0' }}>
            <Text style={{ color: '#F57C00', fontWeight: '600', fontSize: 11 }}>This Week</Text>
          </Chip>
        </View>

        {leaders.slice(0, 3).map((leader, index) => {
          const rank = index + 1;
          const medal = getRankMedal(rank);
          const isCurrentUser = leader.id === currentUserId;

          return (
            <View
              key={leader.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: isCurrentUser ? '#F3E5F5' : 'transparent',
                marginBottom: 8
              }}
            >
              <Text variant="headlineSmall" style={{ marginRight: 12, width: 40, textAlign: 'center' }}>
                {medal.label}
              </Text>
              <Avatar.Text
                size={40}
                label={leader.name[0]}
                style={{ backgroundColor: getUserColor(leader.name), marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
                  {leader.name}
                </Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  {leader.total_xp} XP • {leader.tasks_completed} tasks
                </Text>
              </View>
              {leader.current_streak > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <IconSymbol size={16} name="flame.fill" color="#FF5722" />
                  <Text variant="bodySmall" style={{ color: '#FF5722', fontWeight: '600' }}>
                    {leader.current_streak}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </Surface>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconSymbol size={32} name="chart.bar.fill" color="#FF9800" />
          <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
            Leaderboard
          </Text>
        </View>
      </View>

      {/* Timeframe Selector */}
      <View style={{ 
        flexDirection: 'row', 
        gap: 8, 
        paddingHorizontal: 20,
        marginBottom: 16
      }}>
        {(['week', 'month', 'alltime'] as const).map((tf) => (
          <Chip
            key={tf}
            selected={timeframe === tf}
            onPress={() => setTimeframe(tf)}
            style={{ backgroundColor: timeframe === tf ? '#FF9800' : '#f5f5f5' }}
            textStyle={{ color: timeframe === tf ? '#fff' : '#666' }}
          >
            {tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'All Time'}
          </Chip>
        ))}
      </View>

      {/* Leaderboard List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        {leaders.map((leader, index) => {
          const rank = index + 1;
          const medal = getRankMedal(rank);
          const isCurrentUser = leader.id === currentUserId;

          return (
            <Surface
              key={leader.id}
              style={{
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                backgroundColor: isCurrentUser ? '#F3E5F5' : '#fff',
                elevation: isCurrentUser ? 4 : 2,
                borderWidth: isCurrentUser ? 2 : 0,
                borderColor: isCurrentUser ? '#9C27B0' : 'transparent'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Rank */}
                <View style={{ 
                  width: 50, 
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  {rank <= 3 ? (
                    <Text variant="displaySmall">{medal.label}</Text>
                  ) : (
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#f5f5f5',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#666' }}>
                        {rank}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Avatar */}
                <Avatar.Text
                  size={56}
                  label={leader.name[0]}
                  style={{ backgroundColor: getUserColor(leader.name), marginRight: 16 }}
                />

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                      {leader.name}
                    </Text>
                    {isCurrentUser && (
                      <Chip compact style={{ backgroundColor: '#9C27B0' }}>
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 10 }}>YOU</Text>
                      </Chip>
                    )}
                  </View>

                  {/* Stats */}
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <IconSymbol size={16} name="star.fill" color="#FFD700" />
                      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                        {leader.total_xp}
                      </Text>
                      <Text variant="bodySmall" style={{ color: '#666' }}>XP</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <IconSymbol size={16} name="checkmark.circle.fill" color="#4CAF50" />
                      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                        {leader.tasks_completed}
                      </Text>
                      <Text variant="bodySmall" style={{ color: '#666' }}>tasks</Text>
                    </View>

                    {leader.current_streak > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <IconSymbol size={16} name="flame.fill" color="#FF5722" />
                        <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#FF5722' }}>
                          {leader.current_streak}
                        </Text>
                        <Text variant="bodySmall" style={{ color: '#666' }}>day{leader.current_streak !== 1 ? 's' : ''}</Text>
                      </View>
                    )}
                  </View>

                  {/* Earnings */}
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    gap: 4,
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#f0f0f0'
                  }}>
                    <IconSymbol size={16} name="dollarsign.circle.fill" color="#4CAF50" />
                    <Text variant="bodyMedium" style={{ color: '#4CAF50', fontWeight: '600' }}>
                      ${(leader.total_earnings_cents / 100).toFixed(2)} earned
                    </Text>
                  </View>
                </View>
              </View>
            </Surface>
          );
        })}

        {leaders.length === 0 && (
          <EmptyState
            icon="chart.bar"
            title="No Data Yet"
            message="Complete some tasks to appear on the leaderboard!"
          />
        )}
      </ScrollView>
    </View>
  );
}
