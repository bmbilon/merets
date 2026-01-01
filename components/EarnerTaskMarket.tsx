import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { Surface, Text, Chip, Avatar, Searchbar, ProgressBar } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';

interface Task {
  id: string;
  title: string;
  description: string;
  credits: number;
  timeEstimate: string;
  dueDate: string;
  issuerName: string;
  issuerTrustBadge?: string;
  approvalRequired: boolean;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status?: 'recommended' | 'quick' | 'available' | 'active' | 'submitted';
}

interface EarnerTaskMarketProps {
  userName?: string;
  tasks?: Task[];
  activeTasks?: Task[];
  totalEarnings?: number;
  currentStreak?: number;
  onTaskPress: (task: Task) => void;
  onRefresh?: () => void;
}

export default function EarnerTaskMarket({ 
  userName = 'Earner',
  tasks: externalTasks,
  activeTasks: externalActiveTasks,
  totalEarnings = 0,
  currentStreak = 0,
  onTaskPress,
  onRefresh: onRefreshProp
}: EarnerTaskMarketProps) {
  console.log('🎮 NEW EarnerTaskMarket with gamification loaded!');
  
  const [activeSection, setActiveSection] = useState<'available' | 'quick' | 'recommended' | 'active'>('available');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const tasks: Task[] = externalTasks || [];

  const onRefresh = async () => {
    setRefreshing(true);
    if (onRefreshProp) {
      await onRefreshProp();
    }
    setRefreshing(false);
  };

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(t => t.status === activeSection);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.issuerName.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [tasks, activeSection, searchQuery]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#999';
    }
  };

  const renderTaskCard = (task: Task) => (
    <TouchableOpacity
      key={task.id}
      onPress={() => onTaskPress(task)}
      activeOpacity={0.7}
    >
      <Surface
        style={{
          marginBottom: 12,
          borderRadius: 16,
          backgroundColor: '#fff',
          elevation: 2,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: task.status === 'recommended' ? '#FFD700' : 'transparent'
        }}
      >
        {/* Recommended Badge */}
        {task.status === 'recommended' && (
          <View style={{ 
            position: 'absolute', 
            top: 12, 
            right: 12, 
            backgroundColor: '#FFD700',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            zIndex: 1
          }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#000' }}>⭐ Recommended</Text>
          </View>
        )}

        <View style={{ padding: 12 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4, color: '#1a1a1a' }}>
                {task.title}
              </Text>
              <Text variant="bodySmall" style={{ color: '#666', lineHeight: 18 }}>
                {task.description}
              </Text>
            </View>
            
            {/* Earnings Badge */}
            <View style={{ 
              backgroundColor: '#E8F5E9',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              minWidth: 70,
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2E7D32' }}>
                ${task.credits}
              </Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            <Chip
              icon={() => <IconSymbol size={12} name="clock.fill" color="#666" />}
              compact
              style={{ backgroundColor: '#F5F5F5', height: 28 }}
              textStyle={{ fontSize: 11 }}
            >
              {task.timeEstimate}
            </Chip>
            
            <Chip
              compact
              style={{ 
                backgroundColor: getDifficultyColor(task.difficulty) + '20',
                height: 28,
                borderWidth: 1,
                borderColor: getDifficultyColor(task.difficulty)
              }}
              textStyle={{ 
                fontSize: 11, 
                color: getDifficultyColor(task.difficulty),
                fontWeight: '600'
              }}
            >
              {task.difficulty.toUpperCase()}
            </Chip>

            <Chip
              compact
              style={{ backgroundColor: '#E3F2FD', height: 28 }}
              textStyle={{ fontSize: 11, color: '#1976D2', fontWeight: '500' }}
            >
              {task.category}
            </Chip>

            {task.approvalRequired && (
              <Chip
                icon={() => <IconSymbol size={12} name="lock.fill" color="#FF9800" />}
                compact
                style={{ backgroundColor: '#FFF3E0', height: 28 }}
                textStyle={{ fontSize: 11, color: '#FF9800', fontWeight: '500' }}
              >
                Needs approval
              </Chip>
            )}
          </View>

          {/* Footer */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Avatar.Text 
                size={28} 
                label={task.issuerName[0]} 
                style={{ backgroundColor: '#6200ee' }} 
                labelStyle={{ fontSize: 12 }}
              />
              <Text variant="bodySmall" style={{ color: '#666', fontWeight: '500', fontSize: 12 }}>
                {task.issuerName}
              </Text>
            </View>
            
            <View style={{
              backgroundColor: '#6200ee',
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 16
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                Start →
              </Text>
            </View>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>
        {searchQuery.trim() ? '🔍' : activeSection === 'active' ? '🎯' : '📋'}
      </Text>
      <Text variant="titleMedium" style={{ color: '#666', textAlign: 'center', marginBottom: 8 }}>
        {searchQuery.trim() 
          ? 'No tasks found'
          : activeSection === 'active' 
            ? 'No active tasks yet'
            : 'No tasks available'}
      </Text>
      <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center' }}>
        {searchQuery.trim() 
          ? `Try a different search term`
          : activeSection === 'active' 
            ? 'Browse available tasks to get started!'
            : 'Check back soon for new opportunities!'}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header with Stats */}
      <LinearGradient
        colors={['#6200ee', '#7c4dff']}
        style={{
          paddingTop: 50,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      >
        <Text variant="titleLarge" style={{ color: '#fff', fontWeight: 'bold', marginBottom: 12 }}>
          Hey {userName}! 👋
        </Text>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: 12, 
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)'
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, marginBottom: 2 }}>
              Total Earned
            </Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
              ${totalEarnings.toFixed(2)}
            </Text>
          </View>

          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: 12, 
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)'
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, marginBottom: 2 }}>
              Streak 🔥
            </Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
              {currentStreak} days
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <Searchbar
          placeholder="Search tasks..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ 
            backgroundColor: '#fff',
            borderRadius: 12,
            elevation: 0,
            height: 44
          }}
          inputStyle={{ fontSize: 14 }}
          iconColor="#6200ee"
        />
      </LinearGradient>

      {/* Section Tabs */}
      <View style={{ backgroundColor: '#fff', paddingVertical: 12 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          <Chip
            selected={activeSection === 'available'}
            onPress={() => setActiveSection('available')}
            style={{ 
              backgroundColor: activeSection === 'available' ? '#6200ee' : '#f5f5f5',
              height: 36
            }}
            textStyle={{ 
              color: activeSection === 'available' ? '#fff' : '#666',
              fontWeight: '600',
              fontSize: 13
            }}
          >
            📋 Available
          </Chip>
          <Chip
            selected={activeSection === 'quick'}
            onPress={() => setActiveSection('quick')}
            style={{ 
              backgroundColor: activeSection === 'quick' ? '#6200ee' : '#f5f5f5',
              height: 36
            }}
            textStyle={{ 
              color: activeSection === 'quick' ? '#fff' : '#666',
              fontWeight: '600',
              fontSize: 13
            }}
          >
            ⚡ Quick Wins
          </Chip>
          <Chip
            selected={activeSection === 'recommended'}
            onPress={() => setActiveSection('recommended')}
            style={{ 
              backgroundColor: activeSection === 'recommended' ? '#6200ee' : '#f5f5f5',
              height: 36
            }}
            textStyle={{ 
              color: activeSection === 'recommended' ? '#fff' : '#666',
              fontWeight: '600',
              fontSize: 13
            }}
          >
            ⭐ For You
          </Chip>
          <Chip
            selected={activeSection === 'active'}
            onPress={() => setActiveSection('active')}
            style={{ 
              backgroundColor: activeSection === 'active' ? '#6200ee' : '#f5f5f5',
              height: 36
            }}
            textStyle={{ 
              color: activeSection === 'active' ? '#fff' : '#666',
              fontWeight: '600',
              fontSize: 13
            }}
          >
            🔥 My Tasks
          </Chip>
        </ScrollView>
      </View>

      {/* Task List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />
        }
      >
        {filteredTasks.length === 0 ? renderEmptyState() : filteredTasks.map(renderTaskCard)}
      </ScrollView>
    </View>
  );
}
