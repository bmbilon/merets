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
          marginBottom: 16,
          borderRadius: 20,
          backgroundColor: '#fff',
          elevation: 3,
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

        <View style={{ padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 6, color: '#1a1a1a' }}>
                {task.title}
              </Text>
              <Text variant="bodyMedium" style={{ color: '#666', lineHeight: 20 }}>
                {task.description}
              </Text>
            </View>
            
            {/* Earnings Badge */}
            <View style={{ 
              backgroundColor: '#E8F5E9',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              minWidth: 80,
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2E7D32' }}>
                ${task.credits}
              </Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <Chip
              icon={() => <IconSymbol size={14} name="clock.fill" color="#666" />}
              compact
              style={{ backgroundColor: '#F5F5F5', height: 32 }}
              textStyle={{ fontSize: 12 }}
            >
              {task.timeEstimate}
            </Chip>
            
            <Chip
              compact
              style={{ 
                backgroundColor: getDifficultyColor(task.difficulty) + '20',
                height: 32,
                borderWidth: 1,
                borderColor: getDifficultyColor(task.difficulty)
              }}
              textStyle={{ 
                fontSize: 12, 
                color: getDifficultyColor(task.difficulty),
                fontWeight: '600'
              }}
            >
              {task.difficulty.toUpperCase()}
            </Chip>

            <Chip
              compact
              style={{ backgroundColor: '#E3F2FD', height: 32 }}
              textStyle={{ fontSize: 12, color: '#1976D2', fontWeight: '500' }}
            >
              {task.category}
            </Chip>

            {task.approvalRequired && (
              <Chip
                icon={() => <IconSymbol size={14} name="lock.fill" color="#FF9800" />}
                compact
                style={{ backgroundColor: '#FFF3E0', height: 32 }}
                textStyle={{ fontSize: 12, color: '#FF9800', fontWeight: '500' }}
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
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Avatar.Text 
                size={32} 
                label={task.issuerName[0]} 
                style={{ backgroundColor: '#6200ee' }} 
                labelStyle={{ fontSize: 14 }}
              />
              <Text variant="bodySmall" style={{ color: '#666', fontWeight: '500' }}>
                {task.issuerName}
              </Text>
            </View>
            
            <View style={{
              backgroundColor: '#6200ee',
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                Start →
              </Text>
            </View>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
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
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 20,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <Text variant="headlineSmall" style={{ color: '#fff', fontWeight: 'bold', marginBottom: 16 }}>
          Hey {userName}! 👋
        </Text>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: 16, 
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)'
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, marginBottom: 4 }}>
              Total Earned
            </Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
              ${totalEarnings.toFixed(2)}
            </Text>
          </View>

          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: 16, 
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)'
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, marginBottom: 4 }}>
              Streak 🔥
            </Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
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
            borderRadius: 16,
            elevation: 0
          }}
          inputStyle={{ fontSize: 15 }}
          iconColor="#6200ee"
        />
      </LinearGradient>

      {/* Section Tabs */}
      <View style={{ backgroundColor: '#fff', paddingVertical: 16 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
        >
          <Chip
            selected={activeSection === 'available'}
            onPress={() => setActiveSection('available')}
            style={{ 
              backgroundColor: activeSection === 'available' ? '#6200ee' : '#f5f5f5',
              height: 40
            }}
            textStyle={{ 
              color: activeSection === 'available' ? '#fff' : '#666',
              fontWeight: '600'
            }}
          >
            📋 Available
          </Chip>
          <Chip
            selected={activeSection === 'quick'}
            onPress={() => setActiveSection('quick')}
            style={{ 
              backgroundColor: activeSection === 'quick' ? '#6200ee' : '#f5f5f5',
              height: 40
            }}
            textStyle={{ 
              color: activeSection === 'quick' ? '#fff' : '#666',
              fontWeight: '600'
            }}
          >
            ⚡ Quick Wins
          </Chip>
          <Chip
            selected={activeSection === 'recommended'}
            onPress={() => setActiveSection('recommended')}
            style={{ 
              backgroundColor: activeSection === 'recommended' ? '#6200ee' : '#f5f5f5',
              height: 40
            }}
            textStyle={{ 
              color: activeSection === 'recommended' ? '#fff' : '#666',
              fontWeight: '600'
            }}
          >
            ⭐ For You
          </Chip>
          <Chip
            selected={activeSection === 'active'}
            onPress={() => setActiveSection('active')}
            style={{ 
              backgroundColor: activeSection === 'active' ? '#6200ee' : '#f5f5f5',
              height: 40
            }}
            textStyle={{ 
              color: activeSection === 'active' ? '#fff' : '#666',
              fontWeight: '600'
            }}
          >
            🔥 My Tasks
          </Chip>
        </ScrollView>
      </View>

      {/* Task List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />
        }
      >
        {filteredTasks.length === 0 ? renderEmptyState() : filteredTasks.map(renderTaskCard)}
      </ScrollView>
    </View>
  );
}
